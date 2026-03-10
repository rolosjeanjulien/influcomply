// REQ-REG-003, REQ-REG-004 | Chatbot RAG réglementaire — Claude + pgvector
// Pipeline : question → embedding → top-K chunks → Claude prompt → réponse sourcée

import { semanticSearch } from "./knowledge-base"
import { prisma } from "@/lib/prisma"
import type { ChatResponse, RagSource, RegTextType } from "@/types/regulatory"

const SYSTEM_PROMPT = `Tu es un assistant juridique spécialisé dans la réglementation de l'influence commerciale en France.

Tu réponds uniquement à partir des textes réglementaires fournis dans le contexte.
Si une question dépasse le cadre des textes fournis, tu l'indiques clairement et recommandes de consulter un avocat.

Règles de réponse :
- Cite toujours les articles de loi ou sources précises (ex: "Art. 3 loi 2023-451")
- Sois factuel et précis, évite les interprétations extensives
- Si tu n'es pas certain, indique le niveau de certitude
- Structure ta réponse avec des paragraphes clairs
- Limite ta réponse à 400 mots maximum
- Réponds en français

IMPORTANT : N'invente jamais de loi, d'article ou de chiffre qui ne figure pas dans le contexte.`

// Type local pour les résultats Prisma select
type TextRecord = {
  id: string
  title: string
  type: string
  source: string
  url: string | null
}

// ─── Appel Claude API ─────────────────────────────────────────────────────

async function callClaude(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  system: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY non configurée")

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system,
      messages,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error: ${err}`)
  }

  const json = await res.json()
  return (
    json.content
      ?.filter((b: { type: string }) => b.type === "text")
      .map((b: { type: string; text: string }) => b.text)
      .join("") ?? ""
  )
}

// ─── Pipeline RAG principal ───────────────────────────────────────────────

export async function ragChat(
  question: string,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<ChatResponse> {
  // 1. Retrieval — recherche des chunks pertinents
  const chunks = await semanticSearch(question, 6)

  if (chunks.length === 0) {
    return {
      answer:
        "Je n'ai pas trouvé d'informations pertinentes dans ma base de connaissances pour répondre à cette question. " +
        "Pour des questions spécifiques, je vous recommande de consulter directement Légifrance ou un avocat spécialisé.",
      sources: [],
      confidence: "low",
    }
  }

  // 2. Enrichissement des chunks avec les titres des textes parents
  const textIds = [...new Set(chunks.map((c) => c.textId))]
  const texts: TextRecord[] = await prisma.regulatoryText.findMany({
    where: { id: { in: textIds } },
    select: { id: true, title: true, type: true, source: true, url: true },
  })
  const textMap = new Map<string, TextRecord>(texts.map((t) => [t.id, t]))

  // 3. Construction du contexte pour Claude
  const context = chunks
    .map((chunk, i) => {
      const text = textMap.get(chunk.textId)
      const header = text
        ? `[Source ${i + 1}: ${text.title} (${text.source})]`
        : `[Source ${i + 1}]`
      return `${header}\n${chunk.content}`
    })
    .join("\n\n---\n\n")

  // 4. Construction de l'historique (max 6 derniers tours)
  const conversationHistory = history.slice(-6).map((m) => ({
    role: m.role,
    content: m.content,
  }))

  // 5. Appel Claude avec RAG
  const userMessage = `CONTEXTE RÉGLEMENTAIRE:\n${context}\n\n---\n\nQUESTION: ${question}`
  const answer = await callClaude(
    [...conversationHistory, { role: "user", content: userMessage }],
    SYSTEM_PROMPT
  )

  // 6. Construction des sources (REQ-REG-004 — citation obligatoire)
  const sources: RagSource[] = chunks
    .filter((c) => (c.similarity ?? 0) > 0.45)
    .slice(0, 4)
    .map((chunk) => {
      const text = textMap.get(chunk.textId)
      return {
        title: text?.title ?? "Source inconnue",
        type: (text?.type ?? "GUIDE") as RegTextType,
        source: text?.source ?? "",
        url: text?.url ?? null,
        excerpt: chunk.content.slice(0, 200) + (chunk.content.length > 200 ? "…" : ""),
        similarity: chunk.similarity ?? 0,
      }
    })

  // 7. Confiance selon score cosine moyen
  const avgSimilarity =
    chunks.reduce((s, c) => s + (c.similarity ?? 0), 0) / chunks.length
  const confidence: "high" | "medium" | "low" =
    avgSimilarity > 0.75 ? "high" : avgSimilarity > 0.55 ? "medium" : "low"

  return { answer, sources, confidence }
}

// ─── Résumé d'un texte réglementaire ─────────────────────────────────────

export async function summarizeRegulatoryText(textId: string): Promise<string> {
  const text = await prisma.regulatoryText.findUnique({ where: { id: textId } })
  if (!text) throw new Error("Texte introuvable")

  return callClaude(
    [
      {
        role: "user",
        content: `Résume ce texte réglementaire en 3-5 points clés pour un influenceur commercial français.
Mets en évidence les obligations, interdictions et sanctions.
Format : liste à puces, français, concis.

TEXTE:\n${text.content.slice(0, 4000)}`,
      },
    ],
    "Tu es un assistant juridique spécialisé en droit de l'influence commerciale française."
  )
}
