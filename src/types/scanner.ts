// Types partagés du module Scanner
// REQ-SCN-004, REQ-SCN-005, REQ-SCN-006

export type Platform = "INSTAGRAM" | "TIKTOK" | "YOUTUBE"

export type ImportMethod =
  | "OAUTH"
  | "EXTENSION"
  | "MANUAL_URL"
  | "MANUAL_SCREENSHOT"
  | "MANUAL_TEXT"

export type ScanStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"

export type NonConformityType =
  | "MISSING_AD_MENTION"
  | "PROHIBITED_PRODUCT"
  | "RETOUCHED_IMAGE"
  | "OTHER"

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"

// REQ-SCN-006 — pondération du score
export interface ScoreBreakdown {
  total: number // 0–100
  adMention: number // /40
  prohibitedProduct: number // /30
  retouchedImage: number // /15
  // 15 points réservés pour critères futurs
}

export interface DetectedNonConformity {
  type: NonConformityType
  severity: Severity
  description: string
  suggestion: string
  matchedText?: string
  ruleCode?: string
}

export interface ScanAnalysisResult {
  score: ScoreBreakdown
  nonConformities: DetectedNonConformity[]
  rawAnalysis: {
    regexMatches: string[]
    claudeAnalysis?: string
    detectedMentions: string[]
    detectedProducts: string[]
  }
}

export interface PublicationInput {
  platform: Platform
  importMethod: ImportMethod
  url?: string
  content?: string
  publishedAt?: Date
}
