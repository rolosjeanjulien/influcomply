// REQ-REG-001 | Base de connaissances juridique — textes vectorisés (pgvector)
// Architecture : textes → chunks de 512 tokens → embeddings OpenAI text-embedding-3-small
// En l'absence d'OpenAI, fallback sur recherche full-text PostgreSQL

import { prisma } from "@/lib/prisma"
import type { RegulatoryChunk, RegulatoryTextSummary } from "@/types/regulatory"

const CHUNK_SIZE = 512 // tokens approximatifs
const CHUNK_OVERLAP = 64

// ─── Chunking ─────────────────────────────────────────────────────────────

function chunkText(text: string): string[] {
  // Découpage par paragraphes puis agrégation jusqu'à CHUNK_SIZE mots
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0)
  const chunks: string[] = []
  let current = ""

  for (const para of paragraphs) {
    const words = para.split(/\s+/).length
    const currentWords = current.split(/\s+/).length

    if (currentWords + words > CHUNK_SIZE && current.length > 0) {
      chunks.push(current.trim())
      // Overlap : garder les derniers mots du chunk précédent
      const overlapWords = current.split(/\s+/).slice(-CHUNK_OVERLAP).join(" ")
      current = overlapWords + " " + para
    } else {
      current = current ? current + "\n\n" + para : para
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

// ─── Embedding via Claude API (text-embedding via Voyage AI si disponible) ─
// Fallback : vecteur nul → recherche full-text uniquement

async function getEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "voyage-law-2", // modèle spécialisé juridique
        input: [text],
      }),
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data?.[0]?.embedding ?? null
  } catch {
    return null
  }
}

// ─── Indexation d'un texte réglementaire ─────────────────────────────────

export async function indexRegulatoryText(textId: string): Promise<number> {
  const text = await prisma.regulatoryText.findUnique({
    where: { id: textId },
    include: { chunks: true },
  })
  if (!text) throw new Error("Texte introuvable")

  // Supprimer les chunks existants
  await prisma.regulatoryTextChunk.deleteMany({ where: { textId } })

  const chunks = chunkText(text.content)
  let indexed = 0

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await getEmbedding(chunks[i])

    if (embedding) {
      // Insertion avec pgvector (via SQL raw — Prisma ne supporte pas encore vector nativement)
      await prisma.$executeRaw`
        INSERT INTO regulatory_text_chunks (id, text_id, content, chunk_index, embedding)
        VALUES (gen_random_uuid(), ${textId}, ${chunks[i]}, ${i},
                ${JSON.stringify(embedding)}::vector)
      `
    } else {
      // Fallback sans embedding
      await prisma.regulatoryTextChunk.create({
        data: { textId, content: chunks[i], chunkIndex: i },
      })
    }
    indexed++
  }

  return indexed
}

// ─── Recherche sémantique (REQ-REG-001) ──────────────────────────────────

export async function semanticSearch(
  query: string,
  limit = 5
): Promise<RegulatoryChunk[]> {
  const embedding = await getEmbedding(query)

  if (embedding) {
    // Recherche cosine via pgvector
    const rows = await prisma.$queryRaw<
      Array<{ id: string; text_id: string; content: string; chunk_index: number; similarity: number }>
    >`
      SELECT id, text_id, content, chunk_index,
             1 - (embedding <=> ${JSON.stringify(embedding)}::vector) AS similarity
      FROM regulatory_text_chunks
      WHERE 1 - (embedding <=> ${JSON.stringify(embedding)}::vector) > 0.5
      ORDER BY similarity DESC
      LIMIT ${limit}
    `
    return rows.map((r: { id: string; text_id: string; content: string; chunk_index: number; similarity: number }) => ({
      id: r.id,
      textId: r.text_id,
      content: r.content,
      chunkIndex: r.chunk_index,
      similarity: r.similarity,
    }))
  }

  // Fallback : full-text search PostgreSQL
  const rows = await prisma.$queryRaw<
    Array<{ id: string; text_id: string; content: string; chunk_index: number }>
  >`
    SELECT id, text_id, content, chunk_index
    FROM regulatory_text_chunks
    WHERE to_tsvector('french', content) @@ plainto_tsquery('french', ${query})
    ORDER BY ts_rank(to_tsvector('french', content), plainto_tsquery('french', ${query})) DESC
    LIMIT ${limit}
  `
  return rows.map((r: { id: string; text_id: string; content: string; chunk_index: number }) => ({
    id: r.id,
    textId: r.text_id,
    content: r.content,
    chunkIndex: r.chunk_index,
    similarity: 0.5, // score arbitraire pour full-text
  }))
}

// ─── Liste des textes ─────────────────────────────────────────────────────

export async function listRegulatoryTexts(): Promise<RegulatoryTextSummary[]> {
  const texts = await prisma.regulatoryText.findMany({
    where: { isActive: true },
    orderBy: { publishedAt: "desc" },
    include: { _count: { select: { chunks: true } } },
  })

  return texts.map((t: { id: string; title: string; type: string; source: string; url: string | null; publishedAt: Date; isActive: boolean; _count: { chunks: number } }) => ({
    id: t.id,
    title: t.title,
    type: t.type as import("@/types/regulatory").RegTextType,
    source: t.source,
    url: t.url,
    publishedAt: t.publishedAt,
    isActive: t.isActive,
    chunkCount: t._count.chunks,
  }))
}

// ─── Seed initial — textes de la loi 2023-451 ────────────────────────────

export const SEED_TEXTS = [
  {
    title: "Loi n° 2023-451 du 9 juin 2023 visant à encadrer l'influence commerciale",
    type: "LAW" as const,
    source: "JORF",
    url: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000047663185",
    publishedAt: new Date("2023-06-10"),
    content: `Loi n° 2023-451 du 9 juin 2023 visant à encadrer l'influence commerciale et à lutter contre les dérives des influenceurs sur les réseaux sociaux

Article 1 — Définitions
Est considéré comme influenceur commercial toute personne physique ou morale qui, à titre onéreux, mobilise sa notoriété auprès de son audience pour communiquer au public, par voie électronique, des contenus visant à faire la promotion, directement ou indirectement, de biens, de services ou d'une cause quelconque.

Article 2 — Contrat de collaboration
Toute collaboration commerciale entre un influenceur et une marque dépassant 1 000 € HT par année civile doit faire l'objet d'un contrat écrit.

Article 3 — Produits et services interdits
Il est interdit aux influenceurs commerciaux de promouvoir :
- Les actes de chirurgie et de médecine esthétiques
- Les produits contenant de la nicotine ou du tabac
- Les crypto-actifs non enregistrés auprès de l'AMF
- Les paris sportifs en dehors des opérateurs agréés
- Les médicaments soumis à prescription médicale
- Tout placement financier à rendement garanti non réglementé
Les sanctions prévues sont de 2 ans d'emprisonnement et 300 000 € d'amende.

Article 4 — Transparence publicitaire
Toute publication de contenu commercial doit être clairement identifiée comme telle par les mentions : "Publicité", "Partenariat commercial", "#Pub", "#Partenariat" ou toute mention équivalente clairement identifiable. Cette mention doit apparaître dès le début du contenu et être lisible sans interaction de l'utilisateur.

Article 5 — Obligation d'information
L'influenceur doit informer son audience :
- De l'existence d'une relation commerciale
- De la nature de la contrepartie reçue (produit offert, rémunération)
- Que le contenu constitue de la publicité

Article 6 — Retouche d'image
Toute image retouchée modifiant la morphologie d'une personne doit être accompagnée de la mention "Photo retouchée". Toute image générée par intelligence artificielle doit comporter la mention "Image générée par IA".

Article 7 — Responsabilité solidaire
L'annonceur et l'influenceur sont solidairement responsables des dommages causés aux tiers résultant d'un contenu promotionnel illicite ou trompeur. Cette responsabilité solidaire s'applique même en cas de contrat de prestation de services.

Article 8 — Obligation d'établissement
Les influenceurs commerciaux domiciliés hors de l'Union européenne ciblant le public français doivent désigner un représentant légal établi en France ou dans l'Union européenne.

Article 9 — Contrôle et sanctions
La DGCCRF (Direction Générale de la Concurrence, de la Consommation et de la Répression des Fraudes) est chargée du contrôle du respect des dispositions de la présente loi. Les infractions sont passibles :
- Pour les personnes physiques : 2 ans d'emprisonnement et 300 000 € d'amende
- Pour les personnes morales : 1 500 000 € d'amende et interdiction d'exercer`,
  },
  {
    title: "Guide pratique ARPP — Publicité digitale et influence commerciale 2024",
    type: "GUIDE" as const,
    source: "ARPP",
    url: "https://www.arpp.org/nous-consulter/regles/regles-de-deontologie/publicite-digitale/",
    publishedAt: new Date("2024-01-15"),
    content: `Guide pratique ARPP — Publicité digitale et influence commerciale 2024

1. Identification de la publicité
La publicité doit être clairement identifiable comme telle. Les mentions recommandées sont : "Publicité", "Pub", "Partenariat commercial", "En partenariat avec [Marque]", "Sponsorisé par [Marque]".

Ces mentions doivent :
- Apparaître dès le début du contenu (avant le scroll, avant le "voir plus")
- Être lisibles : taille de police suffisante, contraste adéquat
- Être compréhensibles par le grand public, y compris les mineurs

2. Produits de santé et bien-être
La promotion de compléments alimentaires, produits minceur et équipements sportifs est permise sous réserve :
- De ne pas faire de claims thérapeutiques
- De ne pas cibler spécifiquement les mineurs
- D'inclure les mentions légales requises

3. Jeux d'argent et paris sportifs
La promotion de jeux en ligne n'est autorisée qu'auprès d'opérateurs agréés par l'ANJ (Autorité Nationale des Jeux). Les contenus doivent inclure les messages de prévention : "Jouer comporte des risques : endettement, dépendance."

4. Chirurgie esthétique
Toute promotion d'actes de chirurgie ou médecine esthétique est strictement interdite aux influenceurs commerciaux depuis la loi 2023-451.

5. Crypto-actifs
La promotion de crypto-actifs est soumise à l'enregistrement auprès de l'AMF (Autorité des Marchés Financiers) en tant que PSAN (Prestataire de Services sur Actifs Numériques).

6. Image et retouche
Conformément à la loi 2023-451, toute retouche morphologique doit être signalée. L'ARPP recommande une mention visible et non ambiguë.

7. Mineurs
Les contenus commerciaux ne doivent pas cibler spécifiquement les mineurs pour des produits ou services dont la vente leur est interdite ou qui pourraient leur être néfastes.`,
  },
  {
    title: "Position DGCCRF — Contrôle des pratiques commerciales des influenceurs 2024",
    type: "POSITION" as const,
    source: "DGCCRF",
    url: "https://www.economie.gouv.fr/dgccrf/influenceurs",
    publishedAt: new Date("2024-03-01"),
    content: `Position DGCCRF — Contrôle des pratiques commerciales des influenceurs 2024

1. Cadre de contrôle
La DGCCRF a renforcé ses équipes dédiées au contrôle des pratiques commerciales sur les réseaux sociaux. En 2023, 60 % des influenceurs contrôlés présentaient au moins une pratique non conforme.

2. Points de vigilance prioritaires

2.1 Identification publicitaire insuffisante
L'absence ou l'insuffisance de la mention publicitaire constitue une pratique commerciale trompeuse au sens des articles L121-1 et suivants du Code de la consommation. Les abréviations ambiguës (#ad, #sp, #collab) sans mention explicite sont jugées insuffisantes.

2.2 Promotion de produits interdits
La DGCCRF a constaté une persistance de la promotion de chirurgie esthétique et de produits de nutrition sportive aux claims non fondés. Ces pratiques font l'objet de poursuites systématiques.

2.3 Dropshipping et vente directe
Les influenceurs gérant des boutiques en ligne sont soumis aux règles du e-commerce : délais de livraison, droit de rétractation 14 jours, mentions légales.

2.4 Formations et coaching
La promotion de formations payantes doit inclure le numéro de déclaration d'activité de l'organisme de formation et les mentions obligatoires (prix, modalités, certification).

3. Procédures de sanction
La DGCCRF peut :
- Adresser des injonctions administratives (délai de mise en conformité 30 jours)
- Infliger des amendes administratives jusqu'à 15 000 € par manquement
- Transmettre au Parquet pour les infractions pénales (art. 3 loi 2023-451)
- Demander aux plateformes le retrait des contenus non conformes

4. Coopération avec les plateformes
Des accords de coopération ont été conclus avec Meta, TikTok et YouTube pour le signalement et le retrait accéléré des contenus non conformes.`,
  },
]
