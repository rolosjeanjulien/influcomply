// REQ-INT-001 | CRUD clés API
import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { createApiKey, getUserApiKeys, revokeApiKey } from "@/services/integrations/api-key-service"
import { z } from "zod"

const createKeySchema = z.object({
  name: z.string().min(1).max(60),
  tier: z.enum(["FREE", "STARTER", "PRO", "ENTERPRISE"]).default("FREE"),
  expiresInDays: z.coerce.number().min(1).max(365).optional(),
})

async function getDbUser(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return prisma.user.findUnique({ where: { supabaseId: user.id } })
}

export async function GET(req: NextRequest) {
  const dbUser = await getDbUser(req)
  if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const keys = await getUserApiKeys(dbUser.id)
  return NextResponse.json({ keys })
}

export async function POST(req: NextRequest) {
  const dbUser = await getDbUser(req)
  if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = createKeySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
  }

  const key = await createApiKey(dbUser.id, parsed.data.name, parsed.data.tier, parsed.data.expiresInDays)
  return NextResponse.json(key, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const dbUser = await getDbUser(req)
  if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const keyId = searchParams.get("id")
  if (!keyId) return NextResponse.json({ error: "id requis" }, { status: 400 })

  await revokeApiKey(keyId, dbUser.id)
  return NextResponse.json({ ok: true })
}
