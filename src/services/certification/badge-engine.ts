// REQ-CRT-001, REQ-CRT-004 | Moteur de certification — attribution et révocation du badge
// Logique : score moyen ≥ 80/100 sur 90 jours → CERTIFIED ; < 70/100 sur 30 jours → REVOKED

import { prisma } from "@/lib/prisma"
import { BADGE_RULES, type BadgeStatus, type BadgeEvaluationResult } from "@/types/certification"

// ─── Calcul du score moyen sur une fenêtre glissante ─────────────────────

async function getAverageScore(userId: string, days: number): Promise<{ avg: number | null; count: number }> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const scores = await prisma.complianceScore.findMany({
    where: {
      userId,
      createdAt: { gte: since },
    },
    select: { score: true },
    orderBy: { createdAt: "desc" },
  })

  if (scores.length < BADGE_RULES.MIN_SCANS) {
    return { avg: null, count: scores.length }
  }

  const avg = scores.reduce((s: number, r: { score: number }) => s + r.score, 0) / scores.length
  return { avg: Math.round(avg), count: scores.length }
}

// ─── Évaluation d'un créateur individuel ─────────────────────────────────

export async function evaluateCreatorBadge(userId: string): Promise<BadgeEvaluationResult> {
  // Récupérer ou créer le badge
  const badge = await prisma.badge.upsert({
    where: { userId },
    create: { userId, status: "NONE" },
    update: {},
  })

  const previousStatus = badge.status as BadgeStatus

  const { avg: score90d, count: scans90d } = await getAverageScore(userId, BADGE_RULES.CERTIFICATION_DAYS)
  const { avg: score30d } = await getAverageScore(userId, BADGE_RULES.REVOCATION_DAYS)

  let newStatus: BadgeStatus = previousStatus
  let reason = "Aucun changement"

  // Règle de révocation (REQ-CRT-004) — priorité sur la certification
  if (
    previousStatus === "CERTIFIED" &&
    score30d !== null &&
    score30d < BADGE_RULES.REVOCATION_SCORE
  ) {
    newStatus = "REVOKED"
    reason = `Score moyen 30j de ${score30d}/100 inférieur au seuil de révocation (${BADGE_RULES.REVOCATION_SCORE}/100)`
  }
  // Règle de certification (REQ-CRT-001)
  else if (
    (previousStatus === "NONE" || previousStatus === "ELIGIBLE" || previousStatus === "REVOKED") &&
    score90d !== null &&
    score90d >= BADGE_RULES.CERTIFICATION_SCORE
  ) {
    newStatus = "CERTIFIED"
    reason = `Score moyen 90j de ${score90d}/100 ≥ seuil de certification (${BADGE_RULES.CERTIFICATION_SCORE}/100)`
  }
  // Mise à jour du statut ELIGIBLE (proche du seuil)
  else if (
    previousStatus === "NONE" &&
    score90d !== null &&
    score90d >= BADGE_RULES.CERTIFICATION_SCORE - 10
  ) {
    newStatus = "ELIGIBLE"
    reason = `Score moyen 90j de ${score90d}/100 — éligibilité en cours (${BADGE_RULES.CERTIFICATION_DAYS} jours requis)`
  }
  // Perte d'éligibilité
  else if (previousStatus === "ELIGIBLE" && score90d !== null && score90d < BADGE_RULES.CERTIFICATION_SCORE - 10) {
    newStatus = "NONE"
    reason = `Score moyen 90j de ${score90d}/100 insuffisant pour maintenir l'éligibilité`
  }

  const changed = newStatus !== previousStatus

  // Persister si changement
  if (changed) {
    await prisma.badge.update({
      where: { userId },
      data: {
        status: newStatus,
        lastCheckedAt: new Date(),
        certifiedSince: newStatus === "CERTIFIED" ? new Date() : badge.certifiedSince,
        revokedAt: newStatus === "REVOKED" ? new Date() : null,
      },
    })

    await prisma.badgeHistory.create({
      data: {
        badgeId: badge.id,
        status: newStatus,
        reason,
        score: score90d ?? score30d,
      },
    })
  } else {
    // Mise à jour du lastCheckedAt même sans changement de statut
    await prisma.badge.update({
      where: { userId },
      data: { lastCheckedAt: new Date() },
    })
  }

  return {
    userId,
    previousStatus,
    newStatus,
    changed,
    reason,
    score90d,
    score30d,
    scansCount: scans90d,
  }
}

// ─── Évaluation de tous les créateurs actifs ─────────────────────────────

export async function runBadgeEvaluationForAll(): Promise<{
  processed: number
  certified: number
  revoked: number
  eligible: number
  errors: number
}> {
  const users = await prisma.user.findMany({
    select: { id: true },
    where: {
      complianceScores: {
        some: {
          createdAt: { gte: new Date(Date.now() - BADGE_RULES.CERTIFICATION_DAYS * 24 * 60 * 60 * 1000) },
        },
      },
    },
  })

  const results = { processed: 0, certified: 0, revoked: 0, eligible: 0, errors: 0 }

  for (const user of users) {
    try {
      const result = await evaluateCreatorBadge(user.id)
      results.processed++
      if (result.changed) {
        if (result.newStatus === "CERTIFIED") results.certified++
        else if (result.newStatus === "REVOKED") results.revoked++
        else if (result.newStatus === "ELIGIBLE") results.eligible++
      }
    } catch {
      results.errors++
    }
  }

  return results
}

// ─── Lecture du badge d'un utilisateur ───────────────────────────────────

export async function getUserBadge(userId: string) {
  return prisma.badge.findUnique({
    where: { userId },
    include: {
      history: {
        orderBy: { changedAt: "desc" },
        take: 10,
      },
    },
  })
}

export async function getCertifiedCreators(page = 1, limit = 20) {
  const skip = (page - 1) * limit
  const [creators, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        isPublic: true,
        badge: { status: "CERTIFIED" },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        badge: {
          select: { status: true, certifiedSince: true },
        },
        complianceScores: {
          select: { score: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        socialAccounts: {
          select: { platform: true },
        },
      },
      orderBy: { badge: { certifiedSince: "asc" } },
      skip,
      take: limit,
    }),
    prisma.user.count({
      where: { isPublic: true, badge: { status: "CERTIFIED" } },
    }),
  ])

  return { creators, total, page, limit }
}
