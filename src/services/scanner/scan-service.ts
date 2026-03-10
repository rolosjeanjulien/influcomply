// Service principal du Scanner
// SPC-SCN-003, SPC-SCN-006, SPC-SCN-007, SPC-SCN-010
// REQ-SCN-003 à REQ-SCN-008

import { prisma } from "@/lib/prisma"
import { runScanPipeline } from "./nlp-pipeline"
import type { CreateScanInput } from "@/lib/schemas/scan"

// ─────────────────────────────────────────────
// Création d'une publication + lancement du scan
// ─────────────────────────────────────────────

export async function createAndScan(
  userId: string,
  input: CreateScanInput
): Promise<{ publicationId: string; scanResultId: string }> {
  // 1. Créer la publication
  const publication = await prisma.publication.create({
    data: {
      userId,
      platform: input.platform,
      importMethod: input.importMethod,
      url: input.url,
      content: input.content,
      publishedAt: input.publishedAt,
      mediaUrls: [],
    },
  })

  // 2. Créer le ScanResult en état PROCESSING
  const scanResult = await prisma.scanResult.create({
    data: {
      publicationId: publication.id,
      score: 0,
      status: "PROCESSING",
    },
  })

  // 3. Lancer le pipeline NLP sur le texte disponible
  const textToAnalyze = buildTextForAnalysis(input)

  try {
    const analysis = await runScanPipeline(textToAnalyze)

    // 4. Sauvegarder les résultats
    await prisma.$transaction(async (tx) => {
      // Mettre à jour le ScanResult
      await tx.scanResult.update({
        where: { id: scanResult.id },
        data: {
          score: analysis.score.total,
          adMentionScore: analysis.score.adMention,
          prohibitedScore: analysis.score.prohibitedProduct,
          retouchScore: analysis.score.retouchedImage,
          status: "COMPLETED",
          rawAnalysis: analysis.rawAnalysis as object,
        },
      })

      // Créer les NonConformity
      if (analysis.nonConformities.length > 0) {
        await tx.nonConformity.createMany({
          data: analysis.nonConformities.map((nc) => ({
            scanResultId: scanResult.id,
            type: nc.type,
            severity: nc.severity,
            description: nc.description,
            suggestion: nc.suggestion,
          })),
        })

        // REQ-SCN-007 — Créer les alertes (SLA 15 min)
        await tx.scanAlert.create({
          data: {
            scanResultId: scanResult.id,
            userId,
            type: "NON_CONFORMITY",
            message: `${analysis.nonConformities.length} non-conformité(s) détectée(s) — score : ${analysis.score.total}/100`,
          },
        })
      }

      // Mettre à jour le score de conformité journalier (DSH)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await tx.complianceScore.upsert({
        where: { userId_date: { userId, date: today } },
        create: {
          userId,
          date: today,
          score: analysis.score.total,
          scanCount: 1,
        },
        update: {
          // Moyenne glissante simple avec les scans du jour
          score: {
            // Sera recalculé proprement par le job Trigger.dev
            set: analysis.score.total,
          },
          scanCount: { increment: 1 },
        },
      })
    })
  } catch (error) {
    // Marquer le scan comme échoué
    await prisma.scanResult.update({
      where: { id: scanResult.id },
      data: { status: "FAILED" },
    })
    throw error
  }

  return { publicationId: publication.id, scanResultId: scanResult.id }
}

// ─────────────────────────────────────────────
// Récupération d'un résultat de scan
// ─────────────────────────────────────────────

export async function getScanResult(scanResultId: string, userId: string) {
  const result = await prisma.scanResult.findFirst({
    where: {
      id: scanResultId,
      publication: { userId },
    },
    include: {
      publication: true,
      nonConformities: {
        orderBy: [{ severity: "asc" }, { createdAt: "asc" }],
      },
      alerts: {
        orderBy: { sentAt: "desc" },
        take: 10,
      },
    },
  })
  return result
}

// ─────────────────────────────────────────────
// Liste des publications scannées d'un utilisateur
// ─────────────────────────────────────────────

export async function getUserPublications(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit

  const [publications, total] = await Promise.all([
    prisma.publication.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        scanResults: {
          orderBy: { scannedAt: "desc" },
          take: 1,
          include: {
            nonConformities: { where: { isResolved: false } },
          },
        },
      },
    }),
    prisma.publication.count({ where: { userId } }),
  ])

  return { publications, total, page, limit }
}

// ─────────────────────────────────────────────
// Marquer une non-conformité comme résolue
// ─────────────────────────────────────────────

export async function resolveNonConformity(
  nonConformityId: string,
  userId: string
) {
  // Vérifier que la non-conformité appartient à l'utilisateur
  const nc = await prisma.nonConformity.findFirst({
    where: {
      id: nonConformityId,
      scanResult: { publication: { userId } },
    },
  })

  if (!nc) throw new Error("Non-conformité introuvable")

  return prisma.nonConformity.update({
    where: { id: nonConformityId },
    data: { isResolved: true, resolvedAt: new Date() },
  })
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function buildTextForAnalysis(input: CreateScanInput): string {
  const parts: string[] = []
  if (input.content) parts.push(input.content)
  if (input.url) parts.push(`URL: ${input.url}`)
  return parts.join("\n\n") || "Contenu non disponible"
}
