// Types partagés — module Certification & Badge
// REQ-CRT-001, REQ-CRT-002, REQ-CRT-003, REQ-CRT-004

export type BadgeStatus = "NONE" | "ELIGIBLE" | "CERTIFIED" | "REVOKED"

// Seuils de la règle d'attribution (REQ-CRT-001, REQ-CRT-004)
export const BADGE_RULES = {
  CERTIFICATION_SCORE: 80,      // score min sur 90 jours pour certifier
  CERTIFICATION_DAYS: 90,       // fenêtre d'évaluation
  REVOCATION_SCORE: 70,         // score min sur 30 jours, sinon révocation
  REVOCATION_DAYS: 30,          // fenêtre de révocation
  MIN_SCANS: 3,                 // scans minimum requis pour évaluation
} as const

export interface BadgeEvaluationResult {
  userId: string
  previousStatus: BadgeStatus
  newStatus: BadgeStatus
  changed: boolean
  reason: string
  score90d: number | null
  score30d: number | null
  scansCount: number
}

export interface BadgePublicProfile {
  slug: string
  name: string
  certifiedSince: Date | null
  status: BadgeStatus
  score: number | null
  verificationUrl: string
  badgeSvgUrl: string
}

// Réponse de l'API publique de vérification (REQ-CRT-002)
export interface VerificationResponse {
  certified: boolean
  status: BadgeStatus
  creatorSlug: string
  certifiedSince: string | null
  verifiedAt: string
  score: number | null
  verificationUrl: string
}

export const BADGE_STATUS_LABELS: Record<BadgeStatus, string> = {
  NONE: "Non certifié",
  ELIGIBLE: "Éligible",
  CERTIFIED: "Certifié",
  REVOKED: "Révoqué",
}

export const BADGE_STATUS_COLORS: Record<BadgeStatus, string> = {
  NONE: "bg-gray-100 text-gray-500",
  ELIGIBLE: "bg-blue-100 text-blue-700",
  CERTIFIED: "bg-green-100 text-green-700",
  REVOKED: "bg-red-100 text-red-600",
}
