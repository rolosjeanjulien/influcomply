"use client"
// REQ-CTR-008, REQ-CTR-009 | SPC-CTR-004, SPC-CTR-006 — Actions lifecycle contrat

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { ContractStatus } from "@/types/contract"
import { Send, CheckCircle, XCircle, Download } from "lucide-react"

interface ContractActionsProps {
  contractId: string
  status: ContractStatus
}

export function ContractActions({ contractId, status }: ContractActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function initiateSignature() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/contracts/${contractId}/sign`, { method: "POST" })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Erreur")
      }
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inattendue")
    } finally {
      setLoading(false)
    }
  }

  async function transition(newStatus: ContractStatus) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Erreur")
      }
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inattendue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {status === "DRAFT" && (
          <>
            <button
              onClick={initiateSignature}
              disabled={loading}
              className="w-full flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              <Send className="h-4 w-4" />
              Envoyer à la signature
            </button>
            <button
              onClick={() => transition("TERMINATED")}
              disabled={loading}
              className="w-full flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-40 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              Annuler le brouillon
            </button>
          </>
        )}

        {status === "PENDING_SIGNATURE" && (
          <>
            <button
              onClick={() => transition("SIGNED")}
              disabled={loading}
              className="w-full flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-40 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              Marquer comme signé
            </button>
            <button
              onClick={() => transition("DRAFT")}
              disabled={loading}
              className="w-full flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Remettre en brouillon
            </button>
          </>
        )}

        {status === "SIGNED" && (
          <button
            onClick={() => transition("ACTIVE")}
            disabled={loading}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-40 transition-colors"
          >
            <CheckCircle className="h-4 w-4" />
            Activer le contrat
          </button>
        )}

        {(status === "ACTIVE" || status === "SIGNED") && (
          <button
            onClick={() => transition("TERMINATED")}
            disabled={loading}
            className="w-full flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-40 transition-colors"
          >
            <XCircle className="h-4 w-4" />
            Résilier le contrat
          </button>
        )}

        {/* Téléchargement (toujours disponible) */}
        <button
          onClick={() => {
            // Déclenche le téléchargement du contenu affiché côté client
            const content = document.querySelector("pre")?.textContent ?? ""
            const blob = new Blob([content], { type: "text/plain" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `contrat-${contractId.slice(0, 8)}.txt`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="w-full flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="h-4 w-4" />
          Télécharger
        </button>
      </div>
    </div>
  )
}
