"use client"
// REQ-INT-002 | Gestion des webhooks — endpoints et événements

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { WebhookEndpointData } from "@/types/integrations"
import { WEBHOOK_EVENTS, WEBHOOK_EVENT_LABELS, type WebhookEvent } from "@/types/integrations"
import { Webhook, Plus, Trash2, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"

const DELIVERY_STATUS_ICONS = {
  DELIVERED: <CheckCircle className="h-3.5 w-3.5 text-green-500" />,
  FAILED: <XCircle className="h-3.5 w-3.5 text-red-500" />,
  PENDING: <Clock className="h-3.5 w-3.5 text-amber-500" />,
  RETRYING: <Clock className="h-3.5 w-3.5 text-amber-500" />,
}

interface WebhooksPanelProps {
  endpoints: WebhookEndpointData[]
}

export function WebhooksPanel({ endpoints: initialEndpoints }: WebhooksPanelProps) {
  const router = useRouter()
  const [endpoints, setEndpoints] = useState(initialEndpoints)
  const [creating, setCreating] = useState(false)
  const [newUrl, setNewUrl] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<Set<WebhookEvent>>(
    new Set(["scan.completed", "badge.certified"])
  )
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function toggleEvent(event: WebhookEvent) {
    setSelectedEvents((prev) => {
      const next = new Set(prev)
      if (next.has(event)) next.delete(event)
      else next.add(event)
      return next
    })
  }

  async function createEndpoint() {
    if (!newUrl.trim() || selectedEvents.size === 0) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/webhooks/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl.trim(), events: [...selectedEvents] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur")
      setEndpoints((prev) => [data, ...prev])
      setCreating(false)
      setNewUrl("")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inattendue")
    } finally {
      setLoading(false)
    }
  }

  async function deleteEndpoint(id: string) {
    setDeleting(id)
    try {
      await fetch(`/api/webhooks/endpoints/${id}`, { method: "DELETE" })
      setEndpoints((prev) => prev.filter((e) => e.id !== id))
      router.refresh()
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Webhook className="h-5 w-5 text-purple-600" />
          <h2 className="font-semibold text-gray-900">Webhooks</h2>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ajouter un endpoint
        </button>
      </div>

      {/* Formulaire de création */}
      {creating && (
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL de destination</label>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://votre-app.com/webhooks/influcomply"
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Événements à écouter</label>
            <div className="grid grid-cols-2 gap-2">
              {WEBHOOK_EVENTS.map((event) => (
                <label
                  key={event}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedEvents.has(event)
                      ? "border-purple-300 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedEvents.has(event)}
                    onChange={() => toggleEvent(event)}
                    className="rounded border-gray-300 text-purple-600"
                  />
                  <span className="text-xs text-gray-700">{WEBHOOK_EVENT_LABELS[event]}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={createEndpoint}
              disabled={!newUrl.trim() || selectedEvents.size === 0 || loading}
              className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg disabled:opacity-40 hover:bg-purple-700 transition-colors"
            >
              {loading ? "Création..." : "Créer l'endpoint"}
            </button>
            <button
              onClick={() => { setCreating(false); setError(null) }}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste des endpoints */}
      {endpoints.length === 0 ? (
        <div className="px-6 py-10 text-center text-gray-400 text-sm">
          Aucun webhook configuré. Ajoutez un endpoint pour recevoir des notifications.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {endpoints.map((ep) => (
            <div key={ep.id} className="px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono text-gray-800 truncate">{ep.url}</code>
                    <span
                      className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                        ep.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {ep.isActive ? "Actif" : "Inactif"}
                    </span>
                    {ep.lastDeliveryStatus && (
                      <div className="flex items-center gap-1">
                        {DELIVERY_STATUS_ICONS[ep.lastDeliveryStatus]}
                        <span className="text-xs text-gray-400">Dernier envoi</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ep.events.map((event) => (
                      <span
                        key={event}
                        className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full"
                      >
                        {WEBHOOK_EVENT_LABELS[event]}
                      </span>
                    ))}
                  </div>
                  {ep.deliveriesCount !== undefined && (
                    <p className="text-xs text-gray-400 mt-1">
                      {ep.deliveriesCount} envoi{ep.deliveriesCount !== 1 ? "s" : ""} au total
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteEndpoint(ep.id)}
                  disabled={deleting === ep.id}
                  title="Supprimer"
                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-40 flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Signature */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Chaque requête inclut le header{" "}
          <code className="bg-gray-100 px-1 rounded">X-InfluComply-Signature: sha256=...</code>{" "}
          pour vérification HMAC-SHA256.
        </p>
      </div>
    </div>
  )
}
