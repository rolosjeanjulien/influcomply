// REQ-CTR-002 — Génération du contrat juridique PDF
// SPC-CTR-002

import fs from "fs"
import path from "path"

export interface ContractData {
  creatorName: string
  creatorEmail: string
  brandName: string
  brandEmail: string
  brandSiret?: string | null
  brandRepresentative?: string | null
  collaborationType: "GIFTING" | "PAID_PARTNERSHIP" | "BRAND_AMBASSADOR"
  amount?: number | null
  currency?: string
  startDate?: string | null
  endDate?: string | null
  deliverables?: string | null
  platforms?: string[]
  ipRights?: boolean
  exclusivity?: boolean
  exclusivityMonths?: number | null
}

function loadTemplate(type: "GIFTING" | "PAID_PARTNERSHIP" | "BRAND_AMBASSADOR"): string {
  const fileMap = {
    GIFTING: "gifting.md",
    PAID_PARTNERSHIP: "paid-partnership.md",
    BRAND_AMBASSADOR: "brand-ambassador.md",
  }
  const templatePath = path.join(process.cwd(), "docs", "contract-templates", fileMap[type])

  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, "utf-8")
  }

  // Fallback minimal template
  return getFallbackTemplate(type)
}

function interpolate(template: string, data: ContractData): string {
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
  const amountTTC = data.amount ? (data.amount * 1.2).toFixed(2) : null
  const totalAmount = data.amount && data.startDate && data.endDate
    ? calculateTotalAmount(data.amount, data.startDate, data.endDate)
    : null

  const vars: Record<string, string> = {
    creatorName: data.creatorName,
    creatorEmail: data.creatorEmail,
    brandName: data.brandName,
    brandEmail: data.brandEmail,
    brandSiret: data.brandSiret ?? "",
    brandRepresentative: data.brandRepresentative ?? "son représentant légal",
    amount: data.amount?.toLocaleString("fr-FR") ?? "à définir",
    amountTTC: amountTTC ?? "à définir",
    totalAmount: totalAmount?.toLocaleString("fr-FR") ?? data.amount?.toLocaleString("fr-FR") ?? "à définir",
    currency: data.currency ?? "EUR",
    startDate: data.startDate ? new Date(data.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "à définir",
    endDate: data.endDate ? new Date(data.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "à définir",
    deliverables: data.deliverables ?? "à préciser",
    platforms: data.platforms?.join(", ") ?? "à préciser",
    exclusivityMonths: data.exclusivityMonths?.toString() ?? "3",
    today,
  }

  // Replace {{variable}} patterns
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value)
  }

  // Handle conditional {{var ? ... : ...}} — simplified: just replace remaining
  result = result.replace(/\{\{[^}]+\}\}/g, "")

  // Handle ipRights / exclusivity sections
  if (!data.ipRights) {
    result = result.replace(/\{\{ipRights \? `[^`]*` : `([^`]*)`\}\}/g, "$1")
  } else {
    result = result.replace(/\{\{ipRights \? `([^`]*)` : `[^`]*`\}\}/g, "$1")
  }

  if (!data.exclusivity) {
    result = result.replace(/\{\{exclusivity \? `[^`]*` : `([^`]*)`\}\}/g, "$1")
  } else {
    result = result.replace(/\{\{exclusivity \? `([^`]*)` : `[^`]*`\}\}/g, "$1")
  }

  return result
}

function calculateTotalAmount(monthlyAmount: number, startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const months = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)))
  return monthlyAmount * months
}

export function generateContractText(data: ContractData): string {
  const template = loadTemplate(data.collaborationType)
  return interpolate(template, data)
}

function getFallbackTemplate(type: "GIFTING" | "PAID_PARTNERSHIP" | "BRAND_AMBASSADOR"): string {
  const typeLabel = type === "GIFTING" ? "GIFTING / DOTATION" : type === "PAID_PARTNERSHIP" ? "PARTENARIAT RÉMUNÉRÉ" : "AMBASSADEUR DE MARQUE"

  return `# CONTRAT DE COLLABORATION — ${typeLabel}
## Loi n° 2023-451 du 9 juin 2023

**Entre :**
- L'ANNONCEUR : {{brandName}} ({{brandEmail}})
- LE CRÉATEUR : {{creatorName}} ({{creatorEmail}})

## ARTICLE 1 — OBJET
Collaboration commerciale conforme à la loi n° 2023-451.
Livrables : {{deliverables}}
Période : du {{startDate}} au {{endDate}}
Montant : {{amount}} €

## ARTICLE 2 — MENTIONS OBLIGATOIRES (art. 5)
Mention « Publicité » ou « Collaboration commerciale » obligatoire sur tous les contenus.

## ARTICLE 3 — RESPONSABILITÉ SOLIDAIRE (art. 3 — clause obligatoire)
L'annonceur et le créateur sont solidairement responsables des manquements à la loi 2023-451.

## ARTICLE 4 — PRODUITS INTERDITS (art. 4)
Aucun contenu ne fera la promotion de produits interdits.

Fait le {{today}}.
`
}
