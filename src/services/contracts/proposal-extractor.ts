// REQ-CTR-001 — Extraction IA depuis proposition commerciale
// SPC-CTR-001

import Anthropic from "@anthropic-ai/sdk"

export interface ExtractedProposal {
  // Marque / annonceur
  brandName: string | null
  brandEmail: string | null
  brandSiret: string | null
  brandRepresentative: string | null

  // Collaboration
  collaborationType: "GIFTING" | "PAID_PARTNERSHIP" | "BRAND_AMBASSADOR" | null
  amount: number | null
  currency: string

  // Dates
  startDate: string | null  // ISO date string
  endDate: string | null

  // Contenu
  deliverables: string | null
  platforms: string[]

  // Clauses
  ipRights: boolean
  exclusivity: boolean
  exclusivityMonths: number | null

  // Confiance IA
  confidence: "high" | "medium" | "low"
  missingFields: string[]
  rawNotes: string
}

const EXTRACTION_PROMPT = `Tu es un expert juridique spécialisé dans les contrats d'influence commerciale en France.
Analyse le texte de la proposition commerciale fournie et extrais les informations clés pour préremplir un contrat.

Réponds UNIQUEMENT avec un objet JSON valide contenant les champs suivants :
{
  "brandName": "nom de la marque ou de l'annonceur",
  "brandEmail": "email de contact de la marque",
  "brandSiret": "numéro SIRET si mentionné (14 chiffres)",
  "brandRepresentative": "nom du représentant légal si mentionné",
  "collaborationType": "GIFTING | PAID_PARTNERSHIP | BRAND_AMBASSADOR",
  "amount": nombre (montant en euros, null si non mentionné),
  "currency": "EUR",
  "startDate": "YYYY-MM-DD ou null",
  "endDate": "YYYY-MM-DD ou null",
  "deliverables": "description des livrables attendus (posts, stories, vidéos...)",
  "platforms": ["INSTAGRAM", "TIKTOK", "YOUTUBE"] (uniquement ceux mentionnés),
  "ipRights": true/false (cession de droits mentionnée),
  "exclusivity": true/false (clause d'exclusivité mentionnée),
  "exclusivityMonths": nombre ou null,
  "confidence": "high | medium | low",
  "missingFields": ["liste des champs importants non trouvés"],
  "rawNotes": "observations importantes ou ambiguïtés détectées"
}

Règles :
- collaborationType = "GIFTING" si produits offerts sans rémunération financière
- collaborationType = "PAID_PARTNERSHIP" si rémunération financière prévue
- collaborationType = "BRAND_AMBASSADOR" si partenariat long terme (> 3 mois) ou mot "ambassadeur"
- Pour les montants, extrais uniquement le chiffre (ex: 1500 pour "1 500 €")
- Pour les plateformes, normalise : Instagram→INSTAGRAM, TikTok→TIKTOK, YouTube→YOUTUBE
- confidence = "high" si > 6 champs remplis, "medium" si 4-6, "low" si < 4`

export async function extractProposalData(text: string): Promise<ExtractedProposal> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `${EXTRACTION_PROMPT}\n\n---\nPROPOSITION COMMERCIALE :\n${text}\n---`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== "text") {
    throw new Error("Réponse IA invalide")
  }

  // Extract JSON from response (handles cases where model adds text before/after)
  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("Impossible d'extraire les données de la proposition")
  }

  const parsed = JSON.parse(jsonMatch[0]) as ExtractedProposal

  return {
    brandName: parsed.brandName ?? null,
    brandEmail: parsed.brandEmail ?? null,
    brandSiret: parsed.brandSiret ?? null,
    brandRepresentative: parsed.brandRepresentative ?? null,
    collaborationType: parsed.collaborationType ?? null,
    amount: parsed.amount ?? null,
    currency: parsed.currency ?? "EUR",
    startDate: parsed.startDate ?? null,
    endDate: parsed.endDate ?? null,
    deliverables: parsed.deliverables ?? null,
    platforms: Array.isArray(parsed.platforms) ? parsed.platforms : [],
    ipRights: Boolean(parsed.ipRights),
    exclusivity: Boolean(parsed.exclusivity),
    exclusivityMonths: parsed.exclusivityMonths ?? null,
    confidence: parsed.confidence ?? "low",
    missingFields: Array.isArray(parsed.missingFields) ? parsed.missingFields : [],
    rawNotes: parsed.rawNotes ?? "",
  }
}
