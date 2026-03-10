// REQ-REG-002 | Alertes réglementaires — lecture + marquage lu
import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getActiveAlerts, markAlertRead, syncRegulatoryAlerts } from "@/services/regulatory/alert-service"
import { z } from "zod"

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get("limit") ?? "20")
  const alerts = await getActiveAlerts(limit)
  return NextResponse.json({ alerts })
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  // Action : marquer comme lu
  if (body.action === "mark_read") {
    const parsed = z.object({ alertId: z.string() }).safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "alertId requis" }, { status: 400 })
    await markAlertRead(parsed.data.alertId)
    return NextResponse.json({ ok: true })
  }

  // Action : sync depuis DILA API (admin)
  if (body.action === "sync") {
    const created = await syncRegulatoryAlerts()
    return NextResponse.json({ created })
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 })
}
