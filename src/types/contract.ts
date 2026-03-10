// Types partagés — module Contract Factory
// REQ-CTR-001, REQ-CTR-002, REQ-CTR-003

export type CollaborationType = "GIFTING" | "PAID_PARTNERSHIP" | "BRAND_AMBASSADOR"
export type ContractStatus =
  | "DRAFT"
  | "PENDING_SIGNATURE"
  | "SIGNED"
  | "ACTIVE"
  | "EXPIRED"
  | "TERMINATED"

export interface ContractParty {
  name: string
  email: string
  siret?: string
  address?: string
}

// Données du wizard (SPC-CTR-002)
export interface ContractWizardData {
  // Étape 1 — Type de collaboration
  type: CollaborationType
  // Étape 2 — Parties
  creatorName: string
  creatorEmail: string
  brandName: string
  brandEmail: string
  brandSiret?: string
  // Étape 3 — Conditions
  amount?: number
  currency: string
  startDate?: Date
  endDate?: Date
  deliverables?: string
  // Étape 4 — Clauses spécifiques (pré-remplies)
  hasIpClause: boolean
  hasJointLiabilityClause: boolean // loi 2023-451
  hasExclusivityClause: boolean
  exclusivityMonths?: number
  // Étape 5 — Récap (lecture seule)
}

// Résultat de vérification SIRET — SPC-CTR-007
export interface SiretVerificationResult {
  siret: string
  isValid: boolean
  company?: {
    name: string
    address: string
    activity: string
    isActive: boolean
  }
  error?: string
  fromCache: boolean
}

// Seuil de rémunération — SPC-CTR-003, REQ-CTR-003
export interface ThresholdStatus {
  creatorId: string
  organizationId: string
  year: number
  totalAmount: number
  warningThreshold: number  // 800 €
  mandatoryThreshold: number // 1 000 €
  isWarning: boolean
  isMandatory: boolean
  remaining: number
}

export const COLLABORATION_LABELS: Record<CollaborationType, string> = {
  GIFTING: "Don de produits (Gifting)",
  PAID_PARTNERSHIP: "Partenariat rémunéré",
  BRAND_AMBASSADOR: "Ambassadeur de marque",
}

export const STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: "Brouillon",
  PENDING_SIGNATURE: "En attente de signature",
  SIGNED: "Signé",
  ACTIVE: "Actif",
  EXPIRED: "Expiré",
  TERMINATED: "Résilié",
}
