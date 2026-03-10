// REQ-REG-005 | Moteur de règles de conformité — CRUD + versionnage
// Permet la mise à jour des règles en < 5 jours ouvrés après publication d'un texte

import { prisma } from "@/lib/prisma"
import type { ComplianceRuleData } from "@/types/regulatory"

// ─── CRUD des règles ──────────────────────────────────────────────────────

export async function listComplianceRules(activeOnly = true): Promise<ComplianceRuleData[]> {
  const rules = await prisma.complianceRule.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [{ severity: "asc" }, { code: "asc" }],
  })

  return rules.map((r: { id: string; code: string; name: string; description: string; pattern: string | null; patternType: string; severity: string; legalRef: string | null; isActive: boolean; version: number; updatedAt: Date }) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    description: r.description,
    pattern: r.pattern,
    patternType: r.patternType as import("@/types/regulatory").RulePatternType,
    severity: r.severity as ComplianceRuleData["severity"],
    legalRef: r.legalRef,
    isActive: r.isActive,
    version: r.version,
    updatedAt: r.updatedAt,
  }))
}

export async function upsertComplianceRule(data: {
  code: string
  name: string
  description: string
  pattern?: string
  patternType: "REGEX" | "SEMANTIC" | "HYBRID"
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  legalRef?: string
  isActive?: boolean
}): Promise<ComplianceRuleData> {
  const existing = await prisma.complianceRule.findUnique({ where: { code: data.code } })

  const rule = await prisma.complianceRule.upsert({
    where: { code: data.code },
    create: {
      ...data,
      isActive: data.isActive ?? true,
      version: 1,
    },
    update: {
      ...data,
      version: existing ? existing.version + 1 : 1,
    },
  })

  return {
    id: rule.id,
    code: rule.code,
    name: rule.name,
    description: rule.description,
    pattern: rule.pattern,
    patternType: rule.patternType as import("@/types/regulatory").RulePatternType,
    severity: rule.severity as ComplianceRuleData["severity"],
    legalRef: rule.legalRef,
    isActive: rule.isActive,
    version: rule.version,
    updatedAt: rule.updatedAt,
  }
}

export async function toggleRule(code: string, isActive: boolean): Promise<void> {
  await prisma.complianceRule.update({
    where: { code },
    data: { isActive },
  })
}

// ─── Règles seed — synchronisées avec compliance-rules.ts du scanner ──────

export const SEED_RULES = [
  {
    code: "SCN-001",
    name: "Absence de mention publicitaire",
    description:
      "Le contenu sponsorisé ne mentionne pas clairement la nature publicitaire (art. 4 et 5 loi 2023-451)",
    pattern:
      "(?i)\\b(publicité|partenariat|sponsorisé|#pub|#ad|#partenariat|#sponsored|en partenariat avec)\\b",
    patternType: "REGEX" as const,
    severity: "CRITICAL" as const,
    legalRef: "Loi 2023-451, art. 4 et 5",
    isActive: true,
  },
  {
    code: "SCN-002",
    name: "Promotion chirurgie esthétique",
    description:
      "Promotion d'actes de chirurgie ou médecine esthétique (art. 3 loi 2023-451 — interdit)",
    pattern:
      "(?i)\\b(chirurgie|rhinoplastie|liposuccion|botox|lip filler|augmentation mammaire|abdominoplastie|blépharoplastie)\\b",
    patternType: "REGEX" as const,
    severity: "CRITICAL" as const,
    legalRef: "Loi 2023-451, art. 3 al. 1",
    isActive: true,
  },
  {
    code: "SCN-003",
    name: "Promotion nicotine/tabac",
    description:
      "Promotion de produits contenant de la nicotine ou du tabac (art. 3 loi 2023-451 — interdit)",
    pattern: "(?i)\\b(cigarette|tabac|nicotine|vape|e-cigarette|puff|snus|iqos)\\b",
    patternType: "REGEX" as const,
    severity: "CRITICAL" as const,
    legalRef: "Loi 2023-451, art. 3 al. 2",
    isActive: true,
  },
  {
    code: "SCN-004",
    name: "Promotion crypto-actifs non réglementés",
    description:
      "Promotion de crypto-actifs sans mention de l'enregistrement AMF (art. 3 loi 2023-451)",
    pattern:
      "(?i)\\b(bitcoin|crypto|token|nft|defi|rendement garanti|x10|gains assurés|investissement crypto)\\b",
    patternType: "HYBRID" as const,
    severity: "CRITICAL" as const,
    legalRef: "Loi 2023-451, art. 3 al. 3 + AMF",
    isActive: true,
  },
  {
    code: "SCN-005",
    name: "Promotion paris sportifs non agréés",
    description:
      "Promotion de jeux d'argent en dehors des opérateurs agréés ANJ",
    pattern:
      "(?i)\\b(paris sportifs|betclic|winamax|unibet|1xbet|bet365|bookmaker|cote|mise|jackpot garanti)\\b",
    patternType: "REGEX" as const,
    severity: "HIGH" as const,
    legalRef: "Loi 2023-451, art. 3 al. 4 + Loi ARJEL",
    isActive: true,
  },
  {
    code: "SCN-006",
    name: "Promotion médicaments sur prescription",
    description:
      "Promotion de médicaments soumis à prescription médicale (art. 3 loi 2023-451 — interdit)",
    pattern:
      "(?i)\\b(ordonnance|prescription|antibiotique|traitement médical|médicament|pharmacie|ozempic|mounjaro)\\b",
    patternType: "HYBRID" as const,
    severity: "CRITICAL" as const,
    legalRef: "Loi 2023-451, art. 3 al. 5 + Code de la santé publique",
    isActive: true,
  },
  {
    code: "SCN-007",
    name: "Image retouchée sans mention",
    description:
      "Image dont la morphologie semble modifiée sans la mention obligatoire 'Photo retouchée' (art. 6 loi 2023-451)",
    pattern: null,
    patternType: "SEMANTIC" as const,
    severity: "MEDIUM" as const,
    legalRef: "Loi 2023-451, art. 6",
    isActive: true,
  },
]
