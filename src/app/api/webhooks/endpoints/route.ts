// REQ-INT-002 | CRUD endpoints webhook
import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import {
  createWebhookEndpoint,
  listWebhookEndpoints,
} from "@/services/integrations/webhook-service"
import { WEBHOOK_EVENTS, type WebhookEvent } from "@/types/integrations"
import { z } from "zod"

const endpointSchema = z.object({
  url: z.string().url("URL invalide"),
  events: z.array(z.enum(WEBHOOK_EVENTS as unknown as [string, ...string[]])).min(1),
})

async function getDbUserAndOrg(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) return null

  const orgMember = await prisma.organizationMember.findFirst({
    where: { userId: dbUser.id },
    select: { organizationId: true },
  })

  return { dbUser, organizationId: orgMember?.organizationId ?? null }
}

export async function GET(req: NextRequest) {
  const ctx = await getDbUserAndOrg(req)
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!ctx.organizationId) return NextResponse.json({ endpoints: [] })

  const endpoints = await listWebhookEndpoints(ctx.organizationId)
  return NextResponse.json({ endpoints })
}

export async function POST(req: NextRequest) {
  const ctx = await getDbUserAndOrg(req)
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!ctx.organizationId) {
    return NextResponse.json({ error: "Vous devez appartenir à une organisation" }, { status: 422 })
  }

  const body = await req.json()
  const parsed = endpointSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
  }

  const endpoint = await createWebhookEndpoint(
    ctx.organizationId,
    parsed.data.url,
    parsed.data.events as WebhookEvent[]
  )
  return NextResponse.json(endpoint, { status: 201 })
}
