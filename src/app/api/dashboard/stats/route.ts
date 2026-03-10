// GET /api/dashboard/stats — KPIs + tendances pour le dashboard
// SPC-DSH-001, SPC-DSH-002, SPC-DSH-006

import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import {
  getDashboardKPIs,
  getScoreTrend,
  getNonConformityDistribution,
  getScanVolume,
} from "@/services/dashboard/dashboard-service"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
    })
    if (!user)
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })

    const [kpis, scoreTrend, ncDistribution, scanVolume] = await Promise.all([
      getDashboardKPIs(user.id),
      getScoreTrend(user.id, 90),
      getNonConformityDistribution(user.id),
      getScanVolume(user.id, 30),
    ])

    return NextResponse.json({ kpis, scoreTrend, ncDistribution, scanVolume })
  } catch (error) {
    console.error("[GET /api/dashboard/stats]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
