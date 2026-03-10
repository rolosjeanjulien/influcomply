// POST /api/scan — Créer et lancer un scan
// SPC-SCN-003, SPC-SCN-004, SPC-SCN-006, SPC-SCN-007

import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { createAndScan } from "@/services/scanner/scan-service"
import { createScanSchema } from "@/lib/schemas/scan"
import { ZodError } from "zod"

export async function POST(request: NextRequest) {
  try {
    // Auth
    const supabase = await createSupabaseServerClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Récupérer l'utilisateur Prisma
    const user = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      )
    }

    // Validation
    const body = await request.json()
    const input = createScanSchema.parse(body)

    // Lancer le scan
    const result = await createAndScan(user.id, input)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.flatten() },
        { status: 400 }
      )
    }
    console.error("[POST /api/scan]", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
