// Service Dashboard — KPIs, tendances, scores agrégés
// REQ-DSH-001, REQ-DSH-002, REQ-DSH-006
// SPC-DSH-001, SPC-DSH-002, SPC-DSH-006

import { prisma } from "@/lib/prisma"

// ─────────────────────────────────────────────
// Tendance du score sur N jours (SPC-DSH-006 — graphique linéaire 90j)
// ─────────────────────────────────────────────

export interface ScoreTrendPoint {
  date: string // ISO date YYYY-MM-DD
  score: number
  scanCount: number
}

export async function getScoreTrend(
  userId: string,
  days = 90
): Promise<ScoreTrendPoint[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setHours(0, 0, 0, 0)

  const scores = await prisma.complianceScore.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: "asc" },
  })

  return scores.map((s) => ({
    date: s.date.toISOString().split("T")[0],
    score: s.score,
    scanCount: s.scanCount,
  }))
}

// ─────────────────────────────────────────────
// Distribution des non-conformités par type (SPC-DSH-006 — camembert)
// ─────────────────────────────────────────────

export interface NonConformityDistribution {
  type: string
  label: string
  count: number
  color: string
}

const NC_LABELS: Record<string, { label: string; color: string }> = {
  MISSING_AD_MENTION: { label: "Mention pub. manquante", color: "#ef4444" },
  PROHIBITED_PRODUCT: { label: "Produit interdit", color: "#f97316" },
  RETOUCHED_IMAGE: { label: "Image retouchée", color: "#eab308" },
  OTHER: { label: "Autre", color: "#94a3b8" },
}

export async function getNonConformityDistribution(
  userId: string
): Promise<NonConformityDistribution[]> {
  const results = await prisma.nonConformity.groupBy({
    by: ["type"],
    where: {
      isResolved: false,
      scanResult: { publication: { userId } },
    },
    _count: { type: true },
    orderBy: { _count: { type: "desc" } },
  })

  return results.map((r) => ({
    type: r.type,
    label: NC_LABELS[r.type]?.label ?? r.type,
    count: r._count.type,
    color: NC_LABELS[r.type]?.color ?? "#94a3b8",
  }))
}

// ─────────────────────────────────────────────
// Volume de scans par jour (SPC-DSH-006 — barres)
// ─────────────────────────────────────────────

export interface ScanVolumePoint {
  date: string
  scans: number
  violations: number
}

export async function getScanVolume(
  userId: string,
  days = 30
): Promise<ScanVolumePoint[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const scores = await prisma.complianceScore.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: "asc" },
  })

  return scores.map((s) => ({
    date: s.date.toISOString().split("T")[0],
    scans: s.scanCount,
    violations: 0, // enrichi par jointure si nécessaire
  }))
}

// ─────────────────────────────────────────────
// KPIs globaux pour la page dashboard
// REQ-DSH-001, REQ-DSH-002
// ─────────────────────────────────────────────

export interface DashboardKPIs {
  currentScore: number | null
  scoreChange: number | null // diff vs 7j glissants
  averageScore90d: number | null
  totalScans: number
  totalPublications: number
  unresolvedNonConformities: number
  resolvedNonConformities: number
  activeContracts: number
  badgeStatus: string | null
  certifiedSince: Date | null
}

export async function getDashboardKPIs(userId: string): Promise<DashboardKPIs> {
  const [
    recentScores,
    totalScans,
    totalPublications,
    unresolvedNC,
    resolvedNC,
    activeContracts,
    badge,
  ] = await Promise.all([
    prisma.complianceScore.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 90,
    }),
    prisma.scanResult.count({
      where: { publication: { userId } },
    }),
    prisma.publication.count({ where: { userId } }),
    prisma.nonConformity.count({
      where: {
        isResolved: false,
        scanResult: { publication: { userId } },
      },
    }),
    prisma.nonConformity.count({
      where: {
        isResolved: true,
        scanResult: { publication: { userId } },
      },
    }),
    prisma.contract.count({
      where: {
        creatorId: userId,
        status: { in: ["SIGNED", "ACTIVE"] },
      },
    }),
    prisma.badge.findUnique({ where: { userId } }),
  ])

  const currentScore = recentScores[0]?.score ?? null
  const score7dAgo = recentScores[6]?.score ?? null
  const scoreChange =
    currentScore !== null && score7dAgo !== null
      ? currentScore - score7dAgo
      : null

  const avg90d =
    recentScores.length > 0
      ? Math.round(
          recentScores.reduce((sum, s) => sum + s.score, 0) /
            recentScores.length
        )
      : null

  return {
    currentScore,
    scoreChange,
    averageScore90d: avg90d,
    totalScans,
    totalPublications,
    unresolvedNonConformities: unresolvedNC,
    resolvedNonConformities: resolvedNC,
    activeContracts,
    badgeStatus: badge?.status ?? null,
    certifiedSince: badge?.certifiedSince ?? null,
  }
}

// ─────────────────────────────────────────────
// Score moyen organisation — REQ-DSH-002
// (pour les agences avec plusieurs créateurs)
// ─────────────────────────────────────────────

export async function getOrganizationScore(
  organizationId: string
): Promise<{ avgScore: number; creatorCount: number } | null> {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: {
      user: {
        include: {
          complianceScores: {
            orderBy: { date: "desc" },
            take: 1,
          },
        },
      },
    },
  })

  const scores = members
    .map((m) => m.user.complianceScores[0]?.score)
    .filter((s): s is number => s !== undefined)

  if (scores.length === 0) return null

  return {
    avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    creatorCount: scores.length,
  }
}
