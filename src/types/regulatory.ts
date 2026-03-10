// Types partagés — module Regulatory Intelligence
// REQ-REG-001, REQ-REG-002, REQ-REG-003, REQ-REG-004, REQ-REG-005

export type RegTextType = "LAW" | "DECREE" | "ORDINANCE" | "GUIDE" | "POSITION" | "CERTIFICATE"
export type RulePatternType = "REGEX" | "SEMANTIC" | "HYBRID"
export type AlertSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO"

// ─── Textes réglementaires ────────────────────────────────────────────────

export interface RegulatoryTextSummary {
  id: string
  title: string
  type: RegTextType
  source: string
  url: string | null
  publishedAt: Date
  isActive: boolean
  chunkCount: number
}

export interface RegulatoryTextFull extends RegulatoryTextSummary {
  content: string
  chunks: RegulatoryChunk[]
}

export interface RegulatoryChunk {
  id: string
  textId: string
  content: string
  chunkIndex: number
  similarity?: number // score cosine [0-1], présent dans les résultats de recherche
}

// ─── Alertes réglementaires — REQ-REG-002 ────────────────────────────────

export interface RegulatoryAlertData {
  id: string
  textId: string | null
  title: string
  summary: string
  source: string
  severity: AlertSeverity
  publishedAt: Date
  readAt: Date | null
  actionRequired: boolean
  actionDeadline: Date | null
}

// ─── Chatbot RAG — REQ-REG-003, REQ-REG-004 ──────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  sources?: RagSource[]
  timestamp: Date
}

export interface RagSource {
  title: string
  type: RegTextType
  source: string
  url: string | null
  excerpt: string
  similarity: number
}

export interface ChatRequest {
  question: string
  history?: { role: "user" | "assistant"; content: string }[]
}

export interface ChatResponse {
  answer: string
  sources: RagSource[]
  confidence: "high" | "medium" | "low"
}

// ─── Règles de conformité — REQ-REG-005 ──────────────────────────────────

export interface ComplianceRuleData {
  id: string
  code: string
  name: string
  description: string
  pattern: string | null
  patternType: RulePatternType
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  legalRef: string | null
  isActive: boolean
  version: number
  updatedAt: Date
}

// ─── Labels UI ────────────────────────────────────────────────────────────

export const REG_TEXT_TYPE_LABELS: Record<RegTextType, string> = {
  LAW: "Loi",
  DECREE: "Décret",
  ORDINANCE: "Ordonnance",
  GUIDE: "Guide",
  POSITION: "Position DGCCRF",
  CERTIFICATE: "Certificat ARPP",
}

export const REG_TEXT_TYPE_COLORS: Record<RegTextType, string> = {
  LAW: "bg-purple-100 text-purple-700",
  DECREE: "bg-blue-100 text-blue-700",
  ORDINANCE: "bg-indigo-100 text-indigo-700",
  GUIDE: "bg-green-100 text-green-700",
  POSITION: "bg-orange-100 text-orange-700",
  CERTIFICATE: "bg-teal-100 text-teal-700",
}

export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  CRITICAL: "Critique",
  HIGH: "Élevé",
  MEDIUM: "Moyen",
  LOW: "Faible",
  INFO: "Informatif",
}

export const ALERT_SEVERITY_COLORS: Record<AlertSeverity, string> = {
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  LOW: "bg-blue-100 text-blue-700 border-blue-200",
  INFO: "bg-gray-100 text-gray-600 border-gray-200",
}
