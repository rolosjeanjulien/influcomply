// REQ-REG-001 | Recherche sémantique dans la base de connaissances
import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { semanticSearch, listRegulatoryTexts } from "@/services/regulatory/knowledge-base"
import { z } from "zod"

const searchSchema = z.object({
  q: z.string().min(2).max(500),
  limit: z.coerce.number().min(1).max(20).default(5),
})

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")

  // Sans query → liste des textes disponibles
  if (!q) {
    const texts = await listRegulatoryTexts()
    return NextResponse.json({ texts })
  }

  const parsed = searchSchema.safeParse({ q, limit: searchParams.get("limit") })
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 })
  }

  const results = await semanticSearch(parsed.data.q, parsed.data.limit)
  return NextResponse.json({ results, query: parsed.data.q })
}
