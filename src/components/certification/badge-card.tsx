"use client"
// REQ-CRT-001, REQ-CRT-004 | Carte du badge de certification avec historique

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  BADGE_STATUS_LABELS,
  BADGE_STATUS_COLORS,
  BADGE_RULES,
  type BadgeStatus,
} from "@/types/certification"
import { ShieldCheck, ShieldOff, Clock, RefreshCw, ChevronDown, ChevronUp, Copy, Check } from "lucide-react"

interface BadgeHistory {
  id: string
  status: BadgeStatus
  reason: string | null
  score: number | null
  changedAt: Date
}

interface BadgeCardProps {
  badge: {
    status: BadgeStatus
    certifiedSince: Date | null
    revokedAt: Date | null
    lastCheckedAt: Date | null
    history: BadgeHistory[]
  } | null
  userId: string
  userSlug: string | null
  score90d: number | null
}

export function BadgeCard({ badge, userSlug, score90d }: BadgeCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [copied, setCopied] = useState(false)

  const status: BadgeStatus = badge?.status ?? "NONE"
  const isCertified = status === "CERTIFIED"
  const colorCls = BADGE_STATUS_COLORS[status]

  const progress = score90d !== null ? Math.min(100, Math.round((score90d / BADGE_RULES.CERTIFICATION_SCORE) * 100)) : 0

  async function triggerEvaluation() {
    setLoading(true)
    try {
      await fetch("/api/badges", { method: "POST" })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  function copyBadgeUrl() {
    if (!userSlug) return
    const url = `${window.location.origin}/api/public/badge/${userSlug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Statut principal */}
      <div
        className={`px-6 py-8 flex flex-col items-center text-center border-b border-gray-100 ${
          isCertified ? "bg-gradient-to-b from-green-50 to-white" : "bg-gray-50"
        }`}
      >
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
            isCertified ? "bg-green-100" : "bg-gray-200"
          }`}
        >
          {isCertified ? (
            <ShieldCheck className="h-10 w-10 text-green-600" />
          ) : (
            <ShieldOff className="h-10 w-10 text-gray-400" />
          )}
        </div>

        <span className={`text-sm px-3 py-1 rounded-full font-medium mb-2 ${colorCls}`}>
          {BADGE_STATUS_LABELS[status]}
        </span>

        <h3 className="font-bold text-gray-900 text-lg">
          {isCertified ? "InfluComply Certified" : "Non certifié"}
        </h3>

        {isCertified && badge?.certifiedSince && (
          <p className="text-sm text-gray-500 mt-1">
            Certifié depuis{" "}
            {new Date(badge.certifiedSince).toLocaleDateString("fr-FR", {
              month: "long",
              year: "numeric",
            })}
          </p>
        )}

        {status === "REVOKED" && badge?.revokedAt && (
          <p className="text-sm text-red-500 mt-1">
            Révoqué le {new Date(badge.revokedAt).toLocaleDateString("fr-FR")}
          </p>
        )}
      </div>

      {/* Progression vers la certification */}
      {!isCertified && score90d !== null && (
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progression vers la certification</span>
            <span className="font-medium">{score90d}/100</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                score90d >= BADGE_RULES.CERTIFICATION_SCORE
                  ? "bg-green-500"
                  : score90d >= BADGE_RULES.CERTIFICATION_SCORE - 10
                  ? "bg-amber-400"
                  : "bg-blue-400"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Score moyen 90j requis : {BADGE_RULES.CERTIFICATION_SCORE}/100 — Scans minimum : {BADGE_RULES.MIN_SCANS}
          </p>
        </div>
      )}

      {/* Conditions de certification */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Conditions du badge</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className={`mt-0.5 flex-shrink-0 ${score90d !== null && score90d >= BADGE_RULES.CERTIFICATION_SCORE ? "text-green-500" : "text-gray-300"}`}>
              {score90d !== null && score90d >= BADGE_RULES.CERTIFICATION_SCORE ? "✓" : "○"}
            </span>
            <span className="text-gray-600">Score ≥ {BADGE_RULES.CERTIFICATION_SCORE}/100 sur 90 jours</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-300 mt-0.5 flex-shrink-0">○</span>
            <span className="text-gray-600">Révocation si score &lt; {BADGE_RULES.REVOCATION_SCORE}/100 sur 30 jours</span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 space-y-2 border-b border-gray-100">
        <button
          onClick={triggerEvaluation}
          disabled={loading}
          className="w-full flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Réévaluer mon badge
        </button>

        {userSlug && (
          <button
            onClick={copyBadgeUrl}
            className="w-full flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "URL copiée !" : "Copier l'URL du badge SVG"}
          </button>
        )}
      </div>

      {/* Historique */}
      {badge && badge.history.length > 0 && (
        <div className="px-6 py-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 w-full"
          >
            <Clock className="h-4 w-4" />
            Historique du badge
            {showHistory ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
          </button>

          {showHistory && (
            <div className="mt-3 space-y-2">
              {badge.history.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 text-xs">
                  <div
                    className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white ${
                      entry.status === "CERTIFIED"
                        ? "bg-green-500"
                        : entry.status === "REVOKED"
                        ? "bg-red-500"
                        : "bg-gray-400"
                    }`}
                  >
                    {entry.status === "CERTIFIED" ? "✓" : entry.status === "REVOKED" ? "✗" : "~"}
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">
                      {BADGE_STATUS_LABELS[entry.status]}
                      {entry.score ? ` (${entry.score}/100)` : ""}
                    </div>
                    <div className="text-gray-400">
                      {new Date(entry.changedAt).toLocaleDateString("fr-FR")} — {entry.reason}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dernière vérification */}
      {badge?.lastCheckedAt && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            Dernière évaluation :{" "}
            {new Date(badge.lastCheckedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      )}
    </div>
  )
}
