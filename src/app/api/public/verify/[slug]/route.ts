// REQ-CRT-002 | API publique de vérification du badge — sans authentification requise
// Endpoint destiné aux annonceurs et agences pour vérifier la certification d'un créateur

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { VerificationResponse } from "@/types/certification"

// Cache 5 minutes (CDN edge caching)
export const revalidate = 300

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

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
        },
      },
      complianceScores: {
        select: { score: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })

  if (!user || !user.isPublic) {
    return NextResponse.json(
      { error: "Créateur introuvable ou profil non public" },
      {
        status: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    )
  }

  const badge = user.badge
  const latestScore = user.complianceScores[0]?.score ?? null
  const isCertified = badge?.status === "CERTIFIED"
  const baseUrl = req.nextUrl.origin

  const response: VerificationResponse = {
    certified: isCertified,
    status: (badge?.status ?? "NONE") as import("@/types/certification").BadgeStatus,
    creatorSlug: slug,
    certifiedSince: badge?.certifiedSince?.toISOString() ?? null,
    verifiedAt: new Date().toISOString(),
    score: latestScore,
    verificationUrl: `${baseUrl}/createur/${slug}`,
  }

  return NextResponse.json(response, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  })
}

// Preflight CORS pour intégration cross-origin
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
