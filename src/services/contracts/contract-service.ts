// Service principal — Contract Factory
// REQ-CTR-001, REQ-CTR-002, REQ-CTR-004, REQ-CTR-006, REQ-CTR-007
// SPC-CTR-001, SPC-CTR-002, SPC-CTR-006

import { prisma } from "@/lib/prisma"
import { generateContractContent } from "./template-service"
import type { CreateContractInput } from "@/lib/schemas/contract"
import type { ContractStatus } from "@/types/contract"
import crypto from "crypto"

// ─────────────────────────────────────────────
// Création d'un contrat (SPC-CTR-001, SPC-CTR-002)
// ─────────────────────────────────────────────

export async function createContract(
  creatorId: string,
  input: CreateContractInput
) {
  // Trouver ou créer l'organisation de la marque
  let org = await prisma.organization.findFirst({
    where: { name: input.brandName },
  })

  if (!org) {
    const slug = input.brandName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 60)

    org = await prisma.organization.create({
      data: {
        name: input.brandName,
        slug: `${slug}-${Date.now()}`,
        type: "ADVERTISER",
        siret: input.brandSiret || null,
      },
    })
  }

  // Générer le contenu du contrat via template
  const contractData = {
    type: input.type,
    creatorName: input.creatorName,
    creatorEmail: input.creatorEmail,
    brandName: input.brandName,
    brandEmail: input.brandEmail,
    brandSiret: input.brandSiret,
    amount: input.amount,
    currency: input.currency,
    startDate: input.startDate,
    endDate: input.endDate,
    deliverables: input.deliverables,
    hasIpClause: input.hasIpClause,
    hasJointLiabilityClause: input.hasJointLiabilityClause,
    hasExclusivityClause: input.hasExclusivityClause,
    exclusivityMonths: input.exclusivityMonths,
  }

  const content = generateContractContent(contractData)

  // Hash SHA-256 pour l'intégrité (SPC-CTR-005)
  const fileHash = crypto.createHash("sha256").update(content).digest("hex")

  // Calcul date d'expiration par défaut (1 an)
  const expiresAt = input.endDate
    ? new Date(input.endDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

  const contract = await prisma.contract.create({
    data: {
      creatorId,
      organizationId: org.id,
      type: input.type,
      status: "DRAFT",
      amount: input.amount,
      currency: input.currency,
      startDate: input.startDate,
      endDate: input.endDate,
      fileHash,
      expiresAt,
    },
  })

  return { contract, content, org }
}

// ─────────────────────────────────────────────
// Cycle de vie — SPC-CTR-006
// Machine d'états : DRAFT → PENDING_SIGNATURE → SIGNED → ACTIVE → EXPIRED/TERMINATED
// ─────────────────────────────────────────────

const VALID_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  DRAFT: ["PENDING_SIGNATURE", "TERMINATED"],
  PENDING_SIGNATURE: ["SIGNED", "DRAFT", "TERMINATED"],
  SIGNED: ["ACTIVE", "TERMINATED"],
  ACTIVE: ["EXPIRED", "TERMINATED"],
  EXPIRED: [],
  TERMINATED: [],
}

export async function transitionContract(
  contractId: string,
  creatorId: string,
  newStatus: ContractStatus
) {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, creatorId },
  })

  if (!contract) throw new Error("Contrat introuvable")

  const allowed = VALID_TRANSITIONS[contract.status as ContractStatus]
  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Transition ${contract.status} → ${newStatus} invalide`
    )
  }

  const updateData: Record<string, unknown> = { status: newStatus }
  if (newStatus === "SIGNED") updateData.signedAt = new Date()
  if (newStatus === "TERMINATED") updateData.archivedAt = new Date()

  return prisma.contract.update({
    where: { id: contractId },
    data: updateData,
  })
}

// ─────────────────────────────────────────────
// Initiation de la signature Yousign — SPC-CTR-004
// ─────────────────────────────────────────────

export async function initiateSignature(
  contractId: string,
  creatorId: string,
  content: string
) {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, creatorId },
    include: { organization: true },
  })

  if (!contract) throw new Error("Contrat introuvable")
  if (contract.status !== "DRAFT")
    throw new Error("Seul un brouillon peut être envoyé à la signature")

  // TODO: appel Yousign API v3 en production
  // const yousign = new YousignService()
  // const procedure = await yousign.createProcedure(content, signers)
  // yousignId = procedure.id

  const yousignId = `ys_mock_${Date.now()}`

  return transitionContract(contractId, creatorId, "PENDING_SIGNATURE").then(
    async (c) => {
      await prisma.contract.update({
        where: { id: c.id },
        data: { yousignId },
      })
      return c
    }
  )
}

// ─────────────────────────────────────────────
// Lecture / liste
// ─────────────────────────────────────────────

export async function getCreatorContracts(
  creatorId: string,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit
  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      where: { creatorId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { organization: { select: { name: true, siret: true } } },
    }),
    prisma.contract.count({ where: { creatorId } }),
  ])
  return { contracts, total, page, limit }
}

export async function getContractById(contractId: string, creatorId: string) {
  return prisma.contract.findFirst({
    where: { id: contractId, creatorId },
    include: {
      organization: true,
      template: true,
    },
  })
}
