// REQ-INT-001, REQ-CRT-002 | API v1 — Vérification badge (authentifiée)
// Version authentifiée de /api/public/verify/[slug] avec données enrichies
import { NextRequest, NextResponse } from "next/server"
import { withApiAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export const GET = withApiAuth(async (_req, _ctx, params) => {
  const { slug } = params

  const user = await prisma.user.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      isPublic: true,
      badge: {
        select: {
          status: true,
          certifiedSince: true,
          lastCheckedAt: true,
          history: {
            orderBy: { changedAt: "desc" },
            take: 3,
            select: { status: true, changedAt: true, score: true },
          },
        },
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
  })

  if (!user || !user.isPublic) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 })
  }

  const badge = user.badge
  return NextResponse.json({
    slug,
    name: user.name,
    certified: badge?.status === "CERTIFIED",
    status: badge?.status ?? "NONE",
    certifiedSince: badge?.certifiedSince ?? null,
    lastCheckedAt: badge?.lastCheckedAt ?? null,
    latestScore: (user.complianceScores as Array<{ score: number }>)[0]?.score ?? null,
    platforms: (user.socialAccounts as Array<{ platform: string }>).map((a) => a.platform),
    history: badge?.history ?? [],
    verifiedAt: new Date().toISOString(),
  })
})
