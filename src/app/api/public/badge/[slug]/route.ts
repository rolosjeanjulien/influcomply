// REQ-CRT-002 | Badge SVG dynamique embarquable — sans authentification
// Utilisable dans des README, sites web, signatures email via <img src="...">

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateBadgeSvg, generateShieldsJson } from "@/services/certification/badge-svg"
import type { BadgeStatus } from "@/types/certification"

export const revalidate = 300

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { searchParams } = new URL(req.url)
  const format = searchParams.get("format") ?? "svg" // svg | shields

  const user = await prisma.user.findUnique({
    where: { slug },
    select: {
      name: true,
      isPublic: true,
      badge: {
        select: { status: true, certifiedSince: true },
      },
      complianceScores: {
        select: { score: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })

  const status: BadgeStatus = user?.isPublic ? ((user.badge?.status ?? "NONE") as BadgeStatus) : "NONE"
  const creatorName = user?.name ?? slug
  const score = user?.complianceScores[0]?.score ?? null
  const certifiedSince = user?.badge?.certifiedSince ?? null

  if (format === "shields") {
    return NextResponse.json(generateShieldsJson(status, score), {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=300",
      },
    })
  }

  const svg = generateBadgeSvg(status, creatorName, score, certifiedSince)

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
