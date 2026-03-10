// GET /api/scan/[id] — Récupérer un résultat de scan
// PATCH /api/scan/[id] — Marquer une non-conformité comme résolue

import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { getScanResult, resolveNonConformity } from "@/services/scanner/scan-service"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })

    const { id } = await params
    const result = await getScanResult(id, user.id)

    if (!result) return NextResponse.json({ error: "Scan introuvable" }, { status: 404 })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[GET /api/scan/[id]]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })

    const { nonConformityId } = await request.json()
    if (!nonConformityId) return NextResponse.json({ error: "nonConformityId requis" }, { status: 400 })

    const { id: _scanId } = await params
    const updated = await resolveNonConformity(nonConformityId, user.id)
    return NextResponse.json(updated)
  } catch (error) {
    console.error("[PATCH /api/scan/[id]]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
