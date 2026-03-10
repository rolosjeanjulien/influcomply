// REQ-REG-005 | Moteur de règles — CRUD
import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { listComplianceRules, upsertComplianceRule, toggleRule } from "@/services/regulatory/rules-engine"
import { z } from "zod"

const ruleSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  pattern: z.string().optional(),
  patternType: z.enum(["REGEX", "SEMANTIC", "HYBRID"]),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  legalRef: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const activeOnly = searchParams.get("active") !== "false"
  const rules = await listComplianceRules(activeOnly)
  return NextResponse.json({ rules })
}

export async function PUT(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  // Toggle activation
  if (body.action === "toggle") {
    const parsed = z.object({ code: z.string(), isActive: z.boolean() }).safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 })
    await toggleRule(parsed.data.code, parsed.data.isActive)
    return NextResponse.json({ ok: true })
  }

  // Upsert règle
  const parsed = ruleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
  }

  const rule = await upsertComplianceRule(parsed.data)
  return NextResponse.json(rule)
}
