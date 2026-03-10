// REQ-REG-002 | Alertes évolutions réglementaires — JORF + DGCCRF monitoring
// Polling DILA API (Légifrance) et DGCCRF pour détecter les nouveaux textes

import { prisma } from "@/lib/prisma"
import type { RegulatoryAlertData, AlertSeverity } from "@/types/regulatory"

// ─── DILA API (Légifrance) ────────────────────────────────────────────────

interface DilaSearchResult {
  id: string
  titre: string
  dateParution: string
  nature: string
  nor?: string
}

async function fetchDilaAlerts(since: Date): Promise<DilaSearchResult[]> {
  const DILA_API_KEY = process.env.DILA_API_KEY
  if (!DILA_API_KEY) return []

  const since_str = since.toISOString().split("T")[0]

  try {
    // API Légifrance — recherche dans le JORF
    const res = await fetch(
      "https://api.piste.gouv.fr/dila/legifrance/lf-engine-app/consult/jorf/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DILA_API_KEY}`,
        },
        body: JSON.stringify({
          fond: "JORF",
          recherche: {
            champs: [
              {
                typeChamp: "ALL",
                criteres: [{ typeRecherche: "TOUS_LES_MOTS_DANS_UN_CHAMP", valeur: "influenceur" }],
                operateur: "ET",
              },
            ],
            filtres: [
              { facette: "DATE_SIGNATURE", dateDebut: since_str },
            ],
            pageNumber: 1,
            pageSize: 10,
            sort: "PERTINENCE",
            typePagination: "DEFAUT",
          },
        }),
      }
    )
    if (!res.ok) return []
    const json = await res.json()
    return json.results?.map((r: { id: string; titre: string; dateParution: string; nature: string; nor?: string }) => ({
      id: r.id,
      titre: r.titre,
      dateParution: r.dateParution,
      nature: r.nature,
      nor: r.nor,
    })) ?? []
  } catch {
    return []
  }
}

// ─── Détermination de la sévérité selon le type de texte ─────────────────

function determineSeverity(nature: string): AlertSeverity {
  const upper = nature.toUpperCase()
  if (upper.includes("LOI") || upper.includes("ORDONNANCE")) return "CRITICAL"
  if (upper.includes("DÉCRET") || upper.includes("DECRET")) return "HIGH"
  if (upper.includes("ARRÊTÉ") || upper.includes("ARRETE")) return "MEDIUM"
  return "LOW"
}

// ─── Création d'alertes depuis les résultats DILA ─────────────────────────

export async function syncRegulatoryAlerts(): Promise<number> {
  // Récupérer la date du dernier sync (ou 30 jours par défaut)
  const lastAlert = await prisma.regulatoryAlert.findFirst({
    orderBy: { publishedAt: "desc" },
  })
  const since = lastAlert
    ? new Date(lastAlert.publishedAt)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const results = await fetchDilaAlerts(since)
  let created = 0

  for (const result of results) {
    // Éviter les doublons
    const existing = await prisma.regulatoryAlert.findFirst({
      where: { title: result.titre },
    })
    if (existing) continue

    const severity = determineSeverity(result.nature)
    const actionRequired = severity === "CRITICAL" || severity === "HIGH"
    const actionDeadline = actionRequired
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
      : null

    await prisma.regulatoryAlert.create({
      data: {
        title: result.titre,
        summary: `Nouveau texte publié au Journal Officiel — ${result.nature}. Vérifiez l'impact sur vos pratiques d'influence commerciale.`,
        source: "JORF",
        severity,
        publishedAt: new Date(result.dateParution),
        actionRequired,
        actionDeadline,
      },
    })
    created++
  }

  return created
}

// ─── Récupération des alertes ─────────────────────────────────────────────

export async function getActiveAlerts(limit = 20): Promise<RegulatoryAlertData[]> {
  const alerts = await prisma.regulatoryAlert.findMany({
    orderBy: [{ severity: "asc" }, { publishedAt: "desc" }],
    take: limit,
  })

  return alerts.map((a: { id: string; textId: string | null; title: string; summary: string; source: string; severity: string; publishedAt: Date; readAt: Date | null; actionRequired: boolean; actionDeadline: Date | null }) => ({
    id: a.id,
    textId: a.textId,
    title: a.title,
    summary: a.summary,
    source: a.source,
    severity: a.severity as AlertSeverity,
    publishedAt: a.publishedAt,
    readAt: a.readAt,
    actionRequired: a.actionRequired,
    actionDeadline: a.actionDeadline,
  }))
}

export async function markAlertRead(alertId: string): Promise<void> {
  await prisma.regulatoryAlert.update({
    where: { id: alertId },
    data: { readAt: new Date() },
  })
}

// ─── Alertes prédéfinies — seed initial ───────────────────────────────────

export const SEED_ALERTS = [
  {
    title: "Loi 2023-451 — Entrée en vigueur des sanctions pénales",
    summary:
      "Les sanctions pénales de la loi du 9 juin 2023 (art. 9) sont pleinement applicables : jusqu'à 2 ans d'emprisonnement et 300 000 € d'amende pour promotion de produits interdits.",
    source: "DGCCRF",
    severity: "CRITICAL" as AlertSeverity,
    publishedAt: new Date("2023-06-10"),
    actionRequired: true,
    actionDeadline: null,
  },
  {
    title: "ARPP — Mise à jour recommandations influence commerciale janvier 2024",
    summary:
      "L'ARPP a mis à jour ses recommandations relatives à la publicité digitale. Nouvelles précisions sur les mentions obligatoires pour les stories et Reels.",
    source: "ARPP",
    severity: "HIGH" as AlertSeverity,
    publishedAt: new Date("2024-01-15"),
    actionRequired: true,
    actionDeadline: new Date("2024-04-15"),
  },
  {
    title: "DGCCRF — Bilan 2023 : 60% des influenceurs contrôlés non conformes",
    summary:
      "La DGCCRF a publié son bilan annuel. Principal manquement constaté : identification insuffisante des contenus publicitaires. Renforcement des contrôles prévu en 2024.",
    source: "DGCCRF",
    severity: "MEDIUM" as AlertSeverity,
    publishedAt: new Date("2024-03-01"),
    actionRequired: false,
    actionDeadline: null,
  },
  {
    title: "AMF — Cadre PSAN renforcé pour les crypto-actifs 2024",
    summary:
      "L'AMF a précisé les obligations des influenceurs promouvant des crypto-actifs : enregistrement PSAN obligatoire, mentions légales spécifiques, interdiction du démarchage ciblé.",
    source: "AMF",
    severity: "HIGH" as AlertSeverity,
    publishedAt: new Date("2024-02-10"),
    actionRequired: true,
    actionDeadline: new Date("2024-06-30"),
  },
]
