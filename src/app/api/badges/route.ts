// REQ-CRT-001, REQ-CRT-004 | API badges — consultation + évaluation manuelle
import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { evaluateCreatorBadge, getUserBadge } from "@/services/certification/badge-engine"

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const badge = await getUserBadge(dbUser.id)
  return NextResponse.json({ badge })
}

// POST → forcer une re-évaluation (utile après un lot de scans)
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const result = await evaluateCreatorBadge(dbUser.id)
  return NextResponse.json(result)
}
