// Types partagés — module Integrations (INT)
// REQ-INT-001, REQ-INT-002

export type ApiTier = "FREE" | "STARTER" | "PRO" | "ENTERPRISE"
export type DeliveryStatus = "PENDING" | "DELIVERED" | "FAILED" | "RETRYING"

// ─── Clés API ─────────────────────────────────────────────────────────────

export interface ApiKeyData {
  id: string
  name: string
  prefix: string       // 8 premiers chars affichés, ex: "ic_live_a"
  tier: ApiTier
  lastUsedAt: Date | null
  expiresAt: Date | null
  isActive: boolean
  createdAt: Date
}

// Retourné une seule fois à la création (la clé complète n'est jamais re-exposée)
export interface ApiKeyCreated extends ApiKeyData {
  key: string          // "ic_live_XXXXXXXXXXXXXXXX" — à stocker côté client
}

// Limites par tier
export const API_TIER_LIMITS: Record<ApiTier, { reqPerMinute: number; reqPerDay: number }> = {
  FREE:       { reqPerMinute: 10,  reqPerDay: 100 },
  STARTER:    { reqPerMinute: 60,  reqPerDay: 1_000 },
  PRO:        { reqPerMinute: 300, reqPerDay: 10_000 },
  ENTERPRISE: { reqPerMinute: 999, reqPerDay: 999_999 },
}

// ─── Webhooks ─────────────────────────────────────────────────────────────

export const WEBHOOK_EVENTS = [
  "scan.completed",
  "scan.non_conformity_detected",
  "contract.created",
  "contract.signed",
  "contract.expired",
  "badge.certified",
  "badge.revoked",
  "alert.regulatory",
] as const

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number]

export interface WebhookEndpointData {
  id: string
  url: string
  events: WebhookEvent[]
  isActive: boolean
  createdAt: Date
  deliveriesCount?: number
  lastDeliveryStatus?: DeliveryStatus
}

export interface WebhookPayload<T = unknown> {
  id: string             // UUID unique de l'événement
  event: WebhookEvent
  createdAt: string      // ISO 8601
  data: T
}

// ─── Labels UI ────────────────────────────────────────────────────────────

export const WEBHOOK_EVENT_LABELS: Record<WebhookEvent, string> = {
  "scan.completed":                "Scan terminé",
  "scan.non_conformity_detected":  "Non-conformité détectée",
  "contract.created":              "Contrat créé",
  "contract.signed":               "Contrat signé",
  "contract.expired":              "Contrat expiré",
  "badge.certified":               "Badge attribué",
  "badge.revoked":                 "Badge révoqué",
  "alert.regulatory":              "Alerte réglementaire",
}

export const API_TIER_LABELS: Record<ApiTier, string> = {
  FREE:       "Gratuit",
  STARTER:    "Starter",
  PRO:        "Pro",
  ENTERPRISE: "Enterprise",
}
