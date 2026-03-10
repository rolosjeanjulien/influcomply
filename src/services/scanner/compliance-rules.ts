// Règles de conformité — loi 2023-451, art. 5
// REQ-REG-005, SPC-REG-004 — moteur de règles configurable
// REQ-SCN-004, REQ-SCN-005

import type { DetectedNonConformity, Severity } from "@/types/scanner"

export interface ComplianceRule {
  code: string
  name: string
  type: "MISSING_AD_MENTION" | "PROHIBITED_PRODUCT" | "OTHER"
  severity: Severity
  patterns: RegExp[]
  requiredMentions?: RegExp[] // si AUCUN de ces patterns n'est trouvé → violation
  legalRef: string
  description: string
  suggestion: string
}

// ─────────────────────────────────────────────
// REQ-SCN-004 — Détection des mentions publicitaires obligatoires
// Loi 2023-451, art. 5 : obligation de mentionner "Publicité" ou
// "Collaboration commerciale" de manière claire et lisible
// ─────────────────────────────────────────────

export const AD_MENTION_RULES: ComplianceRule[] = [
  {
    code: "SCN-001",
    name: "Mention publicitaire obligatoire",
    type: "MISSING_AD_MENTION",
    severity: "CRITICAL",
    patterns: [],
    // Au moins un de ces patterns DOIT être présent pour être conforme
    requiredMentions: [
      /\bpublicit[eé]\b/i,
      /\bcollaboration\s+commerciale\b/i,
      /\bpartenariat\s+commercial\b/i,
      /\bcontenu\s+sponsoris[eé]\b/i,
      /\bsponsoris[eé]\s+par\b/i,
      /\ben\s+partenariat\s+avec\b/i,
      /\boffert\s+par\b/i,
      /\b#pub\b/i,
      /\b#ad\b/i,
      /\b#sponsored\b/i,
      /\b#publicite\b/i,
      /\b#publicit[eé]\b/i,
      /\b#collaboration\b/i,
      /\b#partenariat\b/i,
      /\bpaid\s+partnership\b/i,
      /\bsponsored\s+content\b/i,
    ],
    legalRef: "Loi 2023-451, art. 5",
    description:
      "La publication ne contient pas de mention publicitaire obligatoire clairement identifiable.",
    suggestion:
      'Ajoutez la mention "Publicité" ou "Collaboration commerciale" de manière claire et visible en début de publication ou de description.',
  },
]

// ─────────────────────────────────────────────
// REQ-SCN-005 — Produits et services interdits
// Loi 2023-451, art. 3 & décrets d'application
// ─────────────────────────────────────────────

export const PROHIBITED_PRODUCT_RULES: ComplianceRule[] = [
  {
    code: "SCN-002",
    name: "Promotion de chirurgie esthétique",
    type: "PROHIBITED_PRODUCT",
    severity: "CRITICAL",
    patterns: [
      /chirurgie\s+(esth[eé]tique|plastique|reconstructrice)/i,
      /\blipo(suction|sculpture|aspiratio)/i,
      /\brigoplastie\b/i,
      /\baugmentation\s+mammaire\b/i,
      /\bbl[eé]pharoplastie\b/i,
      /\brhino(plastie|chirurgie)\b/i,
      /\bfacelift\b/i,
      /\blift\s+(du\s+visage|du\s+cou|cervico-facial)/i,
    ],
    legalRef: "Loi 2023-451, art. 3 — Décret 2023-1218",
    description: "Promotion de chirurgie esthétique interdite aux influenceurs.",
    suggestion:
      "La promotion de chirurgie esthétique est strictement interdite pour les influenceurs. Supprimez toute référence à ces pratiques.",
  },
  {
    code: "SCN-003",
    name: "Promotion de produits à base de nicotine",
    type: "PROHIBITED_PRODUCT",
    severity: "CRITICAL",
    patterns: [
      /\bcigarette[s]?\s+[eé]lectronique[s]?\b/i,
      /\bvap(otage|oteuse|e-cigarette|e cigarette)\b/i,
      /\bpuff\s*(bar|plus|xxl)?\b/i,
      /\be-?liquid[e]?\b/i,
      /\bnicotine\s+pouch\b/i,
      /\bsnus\b/i,
      /\btabac\s+[àa]\s+chauffer\b/i,
      /\biqos\b/i,
    ],
    legalRef: "Loi Évin — Loi 2023-451, art. 3",
    description: "Promotion de produits contenant de la nicotine interdite.",
    suggestion:
      "La promotion de produits à base de nicotine (cigarettes électroniques, puff, snus…) est interdite. Supprimez ce contenu.",
  },
  {
    code: "SCN-004",
    name: "Promotion de cryptomonnaies non régulées",
    type: "PROHIBITED_PRODUCT",
    severity: "HIGH",
    patterns: [
      /\b(investiss|gagnez|profitez|multipliez).{0,30}(crypto|bitcoin|ethereum|token)/i,
      /\b(crypto|token|nft|coin).{0,30}(invest|profit|gain|rendement)/i,
      /\bcode\s+promo.{0,20}(crypto|trading|forex)/i,
      /\btrading\s+(crypto|forex|cfd)\b/i,
      /\bpassez\s+[àa]\s+l.action.{0,20}(crypto|trading)/i,
    ],
    legalRef: "Loi 2023-451, art. 3 — Règlement MiCA",
    description:
      "Promotion de cryptomonnaies ou d'actifs numériques non régulés sans les avertissements légaux obligatoires.",
    suggestion:
      "Si vous promouvez des cryptomonnaies, vérifiez que l'émetteur dispose d'un agrément PSAN/MiCA et ajoutez les avertissements obligatoires sur les risques de perte.",
  },
  {
    code: "SCN-005",
    name: "Promotion de paris sportifs ciblant les mineurs",
    type: "PROHIBITED_PRODUCT",
    severity: "HIGH",
    patterns: [
      /\bpari[s]?\s+sportif[s]?\b/i,
      /\bbet\s*(365|fr|winner|sport)\b/i,
      /\bunibet|winamax|betclic|pmu\b/i,
      /\bcode\s+promo.{0,20}(pari|bet|sport)\b/i,
      /\bgagner.{0,20}(pari|mise|cote)\b/i,
    ],
    legalRef: "Loi 2023-451, art. 3 — Loi du 12 mai 2010",
    description:
      "Promotion de paris sportifs pouvant toucher un public mineur sans avertissements légaux.",
    suggestion:
      "Assurez-vous que la promotion de paris sportifs cible exclusivement les majeurs, inclut les mentions légales obligatoires (\"Jouer comporte des risques\") et que la plateforme est agréée ANJ.",
  },
  {
    code: "SCN-006",
    name: "Promotion de médicaments ou produits de santé",
    type: "PROHIBITED_PRODUCT",
    severity: "HIGH",
    patterns: [
      /\bm[eé]dicament[s]?\s+(miracle|magique|efficace)\b/i,
      /\bgu[eé]ri[rt].{0,20}(maladie|cancer|diab[eè]te|douleur)\b/i,
      /\bprescription\s+m[eé]dicale\b/i,
      /\b(comprim[eé]|g[eé]lule|cachet).{0,20}(amincissant|br[uû]le.graisse|coupe.faim)\b/i,
      /\bproduit\s+(miraculeux|miracle).{0,30}(poids|minceur|sant[eé])\b/i,
    ],
    legalRef: "Loi 2023-451, art. 3 — Code de la santé publique",
    description:
      "Promotion de médicaments ou allégations de santé sans base scientifique validée.",
    suggestion:
      "Les allégations médicales et la promotion de médicaments sans AMM sont interdites. Consultez un juriste spécialisé en droit de la santé.",
  },
  {
    code: "SCN-007",
    name: "Promotion d'abonnements cachés ou arnaques",
    type: "PROHIBITED_PRODUCT",
    severity: "HIGH",
    patterns: [
      /\b(gratuit|free).{0,20}(abonnement|premium|acc[eè]s)\b/i,
      /\bformation.{0,20}(rich[e]|millionnaire|indépendance\s+financi[eè]re)\b/i,
      /\bdevenir\s+(riche|millionnaire).{0,20}(facilement|rapidement|vite)\b/i,
      /\brevenus?\s+passifs?.{0,20}(euros?|k€|\d+\/mois)\b/i,
    ],
    legalRef: "Loi 2023-451, art. 3 — DGCCRF pratiques commerciales trompeuses",
    description:
      "Promotion pouvant caractériser une pratique commerciale trompeuse.",
    suggestion:
      "Vérifiez que votre promotion ne contient pas d'allégations mensongères sur des gains financiers faciles. Ces pratiques sont sanctionnées par la DGCCRF.",
  },
]

export const ALL_RULES: ComplianceRule[] = [
  ...AD_MENTION_RULES,
  ...PROHIBITED_PRODUCT_RULES,
]

// ─────────────────────────────────────────────
// Détection par règles regex
// ─────────────────────────────────────────────

export function applyRules(text: string): DetectedNonConformity[] {
  const violations: DetectedNonConformity[] = []

  // Vérification mentions publicitaires (présence obligatoire)
  for (const rule of AD_MENTION_RULES) {
    if (!rule.requiredMentions) continue
    const hasMention = rule.requiredMentions.some((pattern) =>
      pattern.test(text)
    )
    if (!hasMention) {
      violations.push({
        type: rule.type,
        severity: rule.severity,
        description: rule.description,
        suggestion: rule.suggestion,
        ruleCode: rule.code,
      })
    }
  }

  // Vérification produits interdits (présence interdite)
  for (const rule of PROHIBITED_PRODUCT_RULES) {
    const matched = rule.patterns.find((pattern) => pattern.test(text))
    if (matched) {
      const match = text.match(matched)
      violations.push({
        type: rule.type,
        severity: rule.severity,
        description: rule.description,
        suggestion: rule.suggestion,
        matchedText: match?.[0],
        ruleCode: rule.code,
      })
    }
  }

  return violations
}
