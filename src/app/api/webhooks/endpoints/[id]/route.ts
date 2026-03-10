// REQ-INT-002 | Suppression d'un endpoint webhook
import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { deleteWebhookEndpoint } from "@/services/integrations/webhook-service"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const orgMember = await prisma.organizationMember.findFirst({
    where: { userId: dbUser.id },
    select: { organizationId: true },
  })
  if (!orgMember) return NextResponse.json({ error: "No organization" }, { status: 422 })

  await deleteWebhookEndpoint(id, orgMember.organizationId)
  return NextResponse.json({ ok: true })
}
