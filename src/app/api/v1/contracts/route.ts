// REQ-INT-001 | API v1 — Contrats (partenaires externes)
import { NextRequest, NextResponse } from "next/server"
import { withApiAuth } from "@/lib/api-auth"
import { createContract, getCreatorContracts } from "@/services/contracts/contract-service"
import { createContractSchema } from "@/lib/schemas/contract"
import { dispatchWebhookEvent } from "@/services/integrations/webhook-service"
import { prisma } from "@/lib/prisma"

export const POST = withApiAuth(async (req, ctx) => {
  const body = await req.json()
  const parsed = createContractSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bad Request", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { contract, org } = await createContract(ctx.userId, parsed.data)

  // Dispatch webhook
  const orgMember = await prisma.organizationMember.findFirst({
    where: { userId: ctx.userId },
    select: { organizationId: true },
  })
  if (orgMember) {
    await dispatchWebhookEvent(orgMember.organizationId, "contract.created", {
      contractId: contract.id,
      type: contract.type,
      brandName: org.name,
      amount: contract.amount,
      currency: contract.currency,
    })
  }

  return NextResponse.json({ contractId: contract.id, status: contract.status }, { status: 201 })
})

export const GET = withApiAuth(async (req, ctx) => {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100)
  const result = await getCreatorContracts(ctx.userId, page, limit)
  return NextResponse.json(result)
})
