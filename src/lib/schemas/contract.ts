// Schémas Zod — module Contract Factory
// SPC-CTR-002 — validation wizard 5 étapes

import { z } from "zod"

export const collaborationTypeSchema = z.enum([
  "GIFTING",
  "PAID_PARTNERSHIP",
  "BRAND_AMBASSADOR",
])

// Étape 1 — Type
export const step1Schema = z.object({
  type: collaborationTypeSchema,
})

// Étape 2 — Parties
export const step2Schema = z.object({
  creatorName: z.string().min(2, "Nom requis"),
  creatorEmail: z.string().email("Email créateur invalide"),
  brandName: z.string().min(2, "Nom de la marque requis"),
  brandEmail: z.string().email("Email marque invalide"),
  brandSiret: z
    .string()
    .regex(/^\d{14}$/, "SIRET invalide (14 chiffres)")
    .optional()
    .or(z.literal("")),
})

// Étape 3 — Conditions
export const step3Schema = z.object({
  amount: z.coerce.number().min(0).optional(),
  currency: z.string().default("EUR"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  deliverables: z.string().max(2000).optional(),
})

// Étape 4 — Clauses
export const step4Schema = z.object({
  hasIpClause: z.boolean().default(true),
  hasJointLiabilityClause: z.boolean().default(true), // obligatoire loi 2023-451
  hasExclusivityClause: z.boolean().default(false),
  exclusivityMonths: z.coerce.number().min(1).max(36).optional(),
})

// Schéma complet
export const createContractSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)

export type CreateContractInput = z.infer<typeof createContractSchema>

// Schéma d'ajout au ledger (suivi seuil €1000)
export const addLedgerEntrySchema = z.object({
  organizationId: z.string().min(1),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  description: z.string().optional(),
  date: z.coerce.date().default(() => new Date()),
})

export type AddLedgerEntryInput = z.infer<typeof addLedgerEntrySchema>
