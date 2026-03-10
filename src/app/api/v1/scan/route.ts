// REQ-INT-001 | API v1 — Scan d'un contenu (partenaires externes)
import { NextRequest, NextResponse } from "next/server"
import { withApiAuth } from "@/lib/api-auth"
import { createAndScan, getScanResult } from "@/services/scanner/scan-service"
import { createScanSchema } from "@/lib/schemas/scan"
import { dispatchWebhookEvent } from "@/services/integrations/webhook-service"
import { prisma } from "@/lib/prisma"

export const POST = withApiAuth(async (req, ctx) => {
  const body = await req.json()
  const parsed = createScanSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bad Request", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { scanResultId, publicationId } = await createAndScan(ctx.userId, parsed.data)

  // Récupérer le résultat complet pour le score et les NC
  const scanData = await getScanResult(scanResultId, ctx.userId)

  // Dispatch webhook si l'utilisateur appartient à une org
  const orgMember = await prisma.organizationMember.findFirst({
    where: { userId: ctx.userId },
    select: { organizationId: true },
  })

  if (orgMember) {
    await dispatchWebhookEvent(orgMember.organizationId, "scan.completed", {
      scanResultId,
      publicationId,
      score: scanData?.score ?? null,
    })

    const ncCount = (scanData?.nonConformities as unknown[])?.length ?? 0
    if (ncCount > 0) {
      await dispatchWebhookEvent(orgMember.organizationId, "scan.non_conformity_detected", {
        scanResultId,
        count: ncCount,
      })
    }
  }

  return NextResponse.json(
    {
      scanResultId,
      score: scanData?.score ?? null,
      status: scanData?.status ?? "PROCESSING",
      nonConformities: (scanData?.nonConformities as unknown[])?.length ?? 0,
      createdAt: scanData?.scannedAt ?? new Date(),
    },
    { status: 201 }
  )
})

export const GET = withApiAuth(async (req, ctx) => {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100)

  const { getUserPublications } = await import("@/services/scanner/scan-service")
  const result = await getUserPublications(ctx.userId, page, limit)

  return NextResponse.json(result)
})
