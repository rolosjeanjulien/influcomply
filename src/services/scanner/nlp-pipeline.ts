// Pipeline NLP — 3 étapes : regex → Claude API → agrégation
// SPC-SCN-004 — détection mentions publicitaires (recall > 95%)
// SPC-SCN-005 — classification produits interdits (précision > 90%)
// SPC-SCN-008 — suggestions de correction via Claude API

import Anthropic from "@anthropic-ai/sdk"
import { applyRules } from "./compliance-rules"
import type {
  DetectedNonConformity,
  ScanAnalysisResult,
  ScoreBreakdown,
} from "@/types/scanner"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ─────────────────────────────────────────────
// Étape 1 — Analyse regex (règles déterministes)
// ─────────────────────────────────────────────

function runRegexAnalysis(text: string): DetectedNonConformity[] {
  return applyRules(text)
}

// ─────────────────────────────────────────────
// Étape 2 — Analyse Claude API
// Détection contextuelle et suggestions enrichies
// SPC-SCN-004, SPC-SCN-005, SPC-SCN-008
// ─────────────────────────────────────────────

interface ClaudeAnalysisResult {
  hasSponsoredContent: boolean
  hasAdMention: boolean
  adMentionText: string | null
  prohibitedCategories: string[]
  prohibitedTexts: string[]
  suggestions: string[]
  reasoning: string
  confidenceScore: number
}

async function runClaudeAnalysis(
  text: string
): Promise<ClaudeAnalysisResult | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null

  const prompt = `Tu es un expert en conformité réglementaire pour l'influence commerciale en France.
Analyse cette publication de créateur de contenu selon la loi n°2023-451 du 9 juin 2023.

PUBLICATION À ANALYSER :
---
${text.slice(0, 3000)}
---

Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "hasSponsoredContent": boolean, // la publication est-elle une collaboration commerciale ?
  "hasAdMention": boolean, // contient-elle une mention publicitaire légale ?
  "adMentionText": string | null, // le texte exact de la mention si présente
  "prohibitedCategories": string[], // parmi : "chirurgie_esthetique", "nicotine", "crypto_non_regule", "paris_sportifs", "medicaments", "arnaque_financiere"
  "prohibitedTexts": string[], // extraits de texte problématiques
  "suggestions": string[], // suggestions concrètes de correction (en français)
  "reasoning": string, // explication courte de ton analyse
  "confidenceScore": number // 0.0 à 1.0
}`

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== "text") return null

    // Extraction du JSON (peut être entouré de backticks)
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    return JSON.parse(jsonMatch[0]) as ClaudeAnalysisResult
  } catch {
    // En cas d'erreur API, on continue avec les résultats regex uniquement
    return null
  }
}

// ─────────────────────────────────────────────
// Étape 3 — Calcul du score pondéré
// SPC-SCN-006 — mention pub: 40pts, produits interdits: 30pts,
//               images retouchées: 15pts, réservé: 15pts
// ─────────────────────────────────────────────

function calculateScore(
  violations: DetectedNonConformity[]
): ScoreBreakdown {
  let adMentionScore = 40 // points restants sur 40
  let prohibitedScore = 30 // points restants sur 30
  let retouchScore = 15 // points restants sur 15

  for (const v of violations) {
    if (v.type === "MISSING_AD_MENTION") {
      // La violation critique enlève tous les points de la catégorie
      const deduction = v.severity === "CRITICAL" ? 40 : v.severity === "HIGH" ? 25 : 15
      adMentionScore = Math.max(0, adMentionScore - deduction)
    } else if (v.type === "PROHIBITED_PRODUCT") {
      const deduction = v.severity === "CRITICAL" ? 30 : v.severity === "HIGH" ? 20 : 10
      prohibitedScore = Math.max(0, prohibitedScore - deduction)
    } else if (v.type === "RETOUCHED_IMAGE") {
      const deduction = v.severity === "HIGH" ? 15 : 8
      retouchScore = Math.max(0, retouchScore - deduction)
    }
  }

  const total = adMentionScore + prohibitedScore + retouchScore + 15 // 15 pts bonus par défaut

  return {
    total,
    adMention: adMentionScore,
    prohibitedProduct: prohibitedScore,
    retouchedImage: retouchScore,
  }
}

// ─────────────────────────────────────────────
// Pipeline principal
// ─────────────────────────────────────────────

export async function runScanPipeline(
  text: string
): Promise<ScanAnalysisResult> {
  // Étape 1 — Regex (synchrone, déterministe)
  const regexViolations = runRegexAnalysis(text)

  // Étape 2 — Claude API (asynchrone, contextuel)
  const claudeResult = await runClaudeAnalysis(text)

  // Fusion des résultats
  const allViolations: DetectedNonConformity[] = [...regexViolations]

  if (claudeResult) {
    // Si Claude détecte un contenu sponsorisé sans mention → renforcer la violation
    if (claudeResult.hasSponsoredContent && !claudeResult.hasAdMention) {
      const existingAdViolation = allViolations.find(
        (v) => v.type === "MISSING_AD_MENTION"
      )
      if (!existingAdViolation) {
        allViolations.push({
          type: "MISSING_AD_MENTION",
          severity: "CRITICAL",
          description:
            "Le contenu semble être une collaboration commerciale sans mention publicitaire.",
          suggestion:
            claudeResult.suggestions[0] ??
            'Ajoutez la mention "Publicité" ou "Collaboration commerciale" en début de publication.',
          ruleCode: "SCN-001-AI",
        })
      } else if (claudeResult.suggestions[0]) {
        // Enrichir la suggestion avec l'analyse contextuelle
        existingAdViolation.suggestion = claudeResult.suggestions[0]
      }
    }

    // Catégories interdites détectées par Claude mais pas par regex
    for (const category of claudeResult.prohibitedCategories) {
      const alreadyDetected = allViolations.some(
        (v) => v.type === "PROHIBITED_PRODUCT"
      )
      if (!alreadyDetected) {
        const categoryLabels: Record<string, string> = {
          chirurgie_esthetique: "chirurgie esthétique",
          nicotine: "produits à base de nicotine",
          crypto_non_regule: "cryptomonnaies non régulées",
          paris_sportifs: "paris sportifs",
          medicaments: "médicaments ou allégations de santé",
          arnaque_financiere: "pratique commerciale potentiellement trompeuse",
        }
        allViolations.push({
          type: "PROHIBITED_PRODUCT",
          severity: "HIGH",
          description: `Promotion de ${categoryLabels[category] ?? category} détectée.`,
          suggestion:
            claudeResult.suggestions.find((s) =>
              s.toLowerCase().includes(category.replace("_", " "))
            ) ?? "Consultez un juriste pour vérifier la conformité de ce contenu.",
          ruleCode: `SCN-AI-${category}`,
        })
      }
    }
  }

  // Calcul du score final
  const score = calculateScore(allViolations)

  return {
    score,
    nonConformities: allViolations,
    rawAnalysis: {
      regexMatches: regexViolations.map((v) => v.matchedText ?? v.type),
      claudeAnalysis: claudeResult?.reasoning,
      detectedMentions: claudeResult?.adMentionText
        ? [claudeResult.adMentionText]
        : [],
      detectedProducts: claudeResult?.prohibitedTexts ?? [],
    },
  }
}
