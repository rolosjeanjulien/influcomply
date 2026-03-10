"use client"

// REQ-SCN-007, REQ-SCN-008 — carte de non-conformité avec suggestion et résolution

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle2,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NonConformityCardProps {
  nonConformity: {
    id: string
    type: string
    severity: string
    description: string
    suggestion: string | null
    isResolved: boolean
    resolvedAt: Date | null
  }
  scanId: string
}

const SEVERITY_CONFIG = {
  CRITICAL: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    badge: "bg-red-100 text-red-700",
    label: "Critique",
  },
  HIGH: {
    icon: AlertTriangle,
    color: "text-orange-500",
    bg: "bg-orange-50 border-orange-200",
    badge: "bg-orange-100 text-orange-700",
    label: "Élevée",
  },
  MEDIUM: {
    icon: AlertTriangle,
    color: "text-yellow-500",
    bg: "bg-yellow-50 border-yellow-200",
    badge: "bg-yellow-100 text-yellow-700",
    label: "Moyenne",
  },
  LOW: {
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    label: "Faible",
  },
}

const TYPE_LABELS: Record<string, string> = {
  MISSING_AD_MENTION: "Mention publicitaire manquante",
  PROHIBITED_PRODUCT: "Produit ou service interdit",
  RETOUCHED_IMAGE: "Image retouchée non déclarée",
  OTHER: "Autre non-conformité",
}

export function NonConformityCard({
  nonConformity,
  scanId,
}: NonConformityCardProps) {
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [resolved, setResolved] = useState(nonConformity.isResolved)
  const [loading, setLoading] = useState(false)

  const config =
    SEVERITY_CONFIG[nonConformity.severity as keyof typeof SEVERITY_CONFIG] ??
    SEVERITY_CONFIG.MEDIUM
  const Icon = config.icon

  async function handleResolve() {
    setLoading(true)
    try {
      const res = await fetch(`/api/scan/${scanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nonConformityId: nonConformity.id }),
      })
      if (res.ok) setResolved(true)
    } finally {
      setLoading(false)
    }
  }

  if (resolved) {
    return (
      <Card className="border-green-200 bg-green-50/50 opacity-75">
        <CardContent className="flex items-center gap-3 py-4 px-5">
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          <p className="text-sm text-green-700 flex-1">
            <span className="font-medium">
              {TYPE_LABELS[nonConformity.type] ?? nonConformity.type}
            </span>{" "}
            — Marquée comme résolue
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("border", config.bg)}>
      <CardContent className="pt-4 pb-4 px-5 space-y-3">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", config.color)} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-zinc-800">
                  {TYPE_LABELS[nonConformity.type] ?? nonConformity.type}
                </span>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    config.badge
                  )}
                >
                  {config.label}
                </span>
              </div>
              <p className="text-sm text-zinc-600 mt-1">
                {nonConformity.description}
              </p>
            </div>
          </div>
        </div>

        {/* Suggestion */}
        {nonConformity.suggestion && (
          <div>
            <button
              type="button"
              onClick={() => setShowSuggestion(!showSuggestion)}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              Suggestion de correction
              {showSuggestion ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {showSuggestion && (
              <div className="mt-2 rounded-md bg-white/70 border border-current/10 px-3 py-2.5">
                <p className="text-sm text-zinc-700">{nonConformity.suggestion}</p>
              </div>
            )}
          </div>
        )}

        {/* Action */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResolve}
            disabled={loading}
            className="text-xs"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            )}
            Marquer comme résolu
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
