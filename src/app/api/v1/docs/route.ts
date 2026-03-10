// REQ-INT-001 | Spécification OpenAPI 3.0 — Documentation de l'API v1
import { NextResponse } from "next/server"

const OPENAPI_SPEC = {
  openapi: "3.0.3",
  info: {
    title: "InfluComply API",
    version: "1.0.0",
    description:
      "API REST permettant aux partenaires (plateformes, agences) d'intégrer les fonctionnalités de conformité réglementaire de l'influence commerciale (loi n° 2023-451 du 9 juin 2023).",
    contact: { name: "InfluComply Support", url: "https://influcomply.fr/contact" },
    license: { name: "Propriétaire", url: "https://influcomply.fr/cgu" },
  },
  servers: [
    { url: "https://influcomply.fr/api/v1", description: "Production" },
    { url: "http://localhost:3000/api/v1",  description: "Développement local" },
  ],
  security: [{ BearerAuth: [] }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "API Key (ic_live_...)",
        description:
          "Clé API InfluComply. Générez vos clés depuis Paramètres > API. Format : `Bearer ic_live_XXXXXXXXXX`",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          message: { type: "string" },
        },
      },
      ScanResult: {
        type: "object",
        properties: {
          scanResultId: { type: "string", format: "cuid" },
          score: { type: "integer", minimum: 0, maximum: 100 },
          status: { type: "string", enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"] },
          nonConformities: { type: "integer", description: "Nombre de non-conformités détectées" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      VerificationResult: {
        type: "object",
        properties: {
          slug: { type: "string" },
          name: { type: "string" },
          certified: { type: "boolean" },
          status: { type: "string", enum: ["NONE", "ELIGIBLE", "CERTIFIED", "REVOKED"] },
          certifiedSince: { type: "string", format: "date-time", nullable: true },
          latestScore: { type: "integer", nullable: true },
          platforms: { type: "array", items: { type: "string" } },
          verifiedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    "/scan": {
      post: {
        summary: "Analyser un contenu",
        description:
          "Soumet un contenu (texte ou URL) pour analyse de conformité à la loi 2023-451. Retourne un score de 0 à 100 et la liste des non-conformités détectées.",
        operationId: "createScan",
        tags: ["Scanner"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["platform", "importMethod"],
                properties: {
                  platform: { type: "string", enum: ["INSTAGRAM", "TIKTOK", "YOUTUBE"] },
                  importMethod: { type: "string", enum: ["TEXT", "URL"] },
                  content: { type: "string", description: "Texte du contenu (si importMethod=TEXT)" },
                  url: { type: "string", format: "uri", description: "URL du post (si importMethod=URL)" },
                },
              },
              examples: {
                text: {
                  summary: "Analyse de texte",
                  value: {
                    platform: "INSTAGRAM",
                    importMethod: "TEXT",
                    content: "Découvrez ce super produit ! #ad @marque",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Scan créé et analyse lancée",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ScanResult" } } },
          },
          "400": { description: "Paramètres invalides", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "Non authentifié", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "429": { description: "Limite de requêtes atteinte", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      get: {
        summary: "Lister les scans",
        description: "Retourne la liste paginée des scans du compte authentifié.",
        operationId: "listScans",
        tags: ["Scanner"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
        ],
        responses: {
          "200": { description: "Liste des scans" },
          "401": { description: "Non authentifié" },
        },
      },
    },
    "/contracts": {
      post: {
        summary: "Créer un contrat",
        description: "Génère un contrat conforme à la loi 2023-451 avec les clauses obligatoires (art. 3, 5, 7).",
        operationId: "createContract",
        tags: ["Contrats"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["type", "creatorName", "creatorEmail", "brandName", "brandEmail", "currency", "hasIpClause", "hasJointLiabilityClause", "hasExclusivityClause"],
                properties: {
                  type: { type: "string", enum: ["GIFTING", "PAID_PARTNERSHIP", "BRAND_AMBASSADOR"] },
                  creatorName: { type: "string" },
                  creatorEmail: { type: "string", format: "email" },
                  brandName: { type: "string" },
                  brandEmail: { type: "string", format: "email" },
                  brandSiret: { type: "string", pattern: "^\\d{14}$" },
                  amount: { type: "number", minimum: 0 },
                  currency: { type: "string", default: "EUR" },
                  hasJointLiabilityClause: { type: "boolean", description: "Obligatoire (loi 2023-451 art. 7)" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Contrat créé" },
          "400": { description: "Paramètres invalides" },
          "401": { description: "Non authentifié" },
        },
      },
      get: {
        summary: "Lister les contrats",
        operationId: "listContracts",
        tags: ["Contrats"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: { "200": { description: "Liste des contrats" } },
      },
    },
    "/verify/{slug}": {
      get: {
        summary: "Vérifier le badge d'un créateur",
        description: "Vérifie le statut de certification InfluComply d'un créateur. Endpoint destiné aux annonceurs et agences pour valider la conformité avant collaboration.",
        operationId: "verifyCreator",
        tags: ["Certification"],
        parameters: [
          { name: "slug", in: "path", required: true, schema: { type: "string" }, description: "Identifiant public du créateur" },
        ],
        responses: {
          "200": {
            description: "Statut de certification",
            content: { "application/json": { schema: { $ref: "#/components/schemas/VerificationResult" } } },
          },
          "404": { description: "Créateur non trouvé" },
        },
      },
    },
  },
  tags: [
    { name: "Scanner", description: "Analyse de conformité des contenus" },
    { name: "Contrats", description: "Gestion des contrats de collaboration" },
    { name: "Certification", description: "Badge et vérification de conformité" },
  ],
}

export async function GET() {
  return NextResponse.json(OPENAPI_SPEC, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=3600",
    },
  })
}
