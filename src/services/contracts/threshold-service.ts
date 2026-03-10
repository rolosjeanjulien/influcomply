// Suivi des seuils de rémunération — SPC-CTR-003
// REQ-CTR-003 — seuil €800 (avertissement) et €1 000 HT (contrat obligatoire)

import { prisma } from "@/lib/prisma"
import type { ThresholdStatus } from "@/types/contract"

const WARNING_THRESHOLD = 800  // € HT
const MANDATORY_THRESHOLD = 1000 // € HT

export async function getThresholdStatus(
  creatorId: string,
  organizationId: string,
  year?: number
): Promise<ThresholdStatus> {
  const targetYear = year ?? new Date().getFullYear()

  const entries = await prisma.giftingLedger.findMany({
    where: { creatorId, organizationId, year: targetYear },
  })

  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0)
  const remaining = Math.max(0, MANDATORY_THRESHOLD - totalAmount)

  return {
    creatorId,
    organizationId,
    year: targetYear,
    totalAmount,
    warningThreshold: WARNING_THRESHOLD,
    mandatoryThreshold: MANDATORY_THRESHOLD,
    isWarning: totalAmount >= WARNING_THRESHOLD,
    isMandatory: totalAmount >= MANDATORY_THRESHOLD,
    remaining,
  }
}

export async function addLedgerEntry(
  creatorId: string,
  organizationId: string,
  amount: number,
  description?: string,
  date: Date = new Date()
): Promise<ThresholdStatus> {
  const year = date.getFullYear()

  await prisma.giftingLedger.create({
    data: {
      creatorId,
      organizationId,
      amount,
      description,
      date,
      year,
    },
  })

  return getThresholdStatus(creatorId, organizationId, year)
}

export async function getThresholdsByCreator(
  creatorId: string
): Promise<ThresholdStatus[]> {
  const currentYear = new Date().getFullYear()

  // Trouver toutes les organisations avec lesquelles le créateur a des échanges
  const orgs = await prisma.giftingLedger.findMany({
    where: { creatorId, year: currentYear },
    distinct: ["organizationId"],
    select: { organizationId: true },
  })

  return Promise.all(
    orgs.map((o) =>
      getThresholdStatus(creatorId, o.organizationId, currentYear)
    )
  )
}
