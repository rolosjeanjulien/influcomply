"use client"
// REQ-INT-001 | Gestion des clés API — création, copie, révocation

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { ApiKeyData, ApiKeyCreated } from "@/types/integrations"
import { API_TIER_LABELS } from "@/types/integrations"
import { Key, Plus, Trash2, Copy, Check, Eye, EyeOff, AlertCircle, ExternalLink } from "lucide-react"

interface ApiKeysPanelProps {
  keys: ApiKeyData[]
}

export function ApiKeysPanel({ keys: initialKeys }: ApiKeysPanelProps) {
  const router = useRouter()
  const [keys, setKeys] = useState(initialKeys)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKey, setNewKey] = useState<ApiKeyCreated | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)

  async function createKey() {
    if (!newKeyName.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })
      if (!res.ok) throw new Error()
      const data: ApiKeyCreated = await res.json()
      setNewKey(data)
      setKeys((prev) => [data, ...prev])
      setNewKeyName("")
      setCreating(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function revokeKey(id: string) {
    setRevoking(id)
    try {
      await fetch(`/api/keys?id=${id}`, { method: "DELETE" })
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, isActive: false } : k)))
      router.refresh()
    } finally {
      setRevoking(null)
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Clés API</h2>
          <a
            href="/api/v1/docs"
            target="_blank"
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 ml-2"
          >
            <ExternalLink className="h-3 w-3" />
            OpenAPI spec
          </a>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle clé
        </button>
      </div>

      {/* Clé nouvellement créée — affichée une seule fois */}
      {newKey && (
        <div className="mx-6 my-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-800 font-medium">
              Copiez cette clé maintenant — elle ne sera plus affichée.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg border border-green-200 px-3 py-2">
            <code className="text-sm font-mono text-gray-800 flex-1 overflow-hidden text-ellipsis">
              {newKey.key}
            </code>
            <button
              onClick={() => copyKey(newKey.key)}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-green-600 transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-2 text-xs text-green-700 hover:text-green-900"
          >
            J&apos;ai sauvegardé ma clé →
          </button>
        </div>
      )}

      {/* Formulaire de création */}
      {creating && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createKey()}
              placeholder="Nom de la clé (ex: Zapier prod)"
              autoFocus
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={createKey}
              disabled={!newKeyName.trim() || loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-40 hover:bg-blue-700 transition-colors"
            >
              {loading ? "Création..." : "Créer"}
            </button>
            <button
              onClick={() => setCreating(false)}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste des clés */}
      {keys.length === 0 ? (
        <div className="px-6 py-10 text-center text-gray-400 text-sm">
          Aucune clé API. Créez-en une pour accéder à l&apos;API.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-3 font-medium text-gray-500">Nom</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Clé (masquée)</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Tier</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Dernière utilisation</th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">Statut</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr
                key={key.id}
                className={`border-b border-gray-100 last:border-0 ${!key.isActive ? "opacity-40" : ""}`}
              >
                <td className="px-6 py-4 font-medium text-gray-900">{key.name}</td>
                <td className="px-6 py-4">
                  <code className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {key.prefix}••••••••
                  </code>
                </td>
                <td className="px-6 py-4 text-gray-600">{API_TIER_LABELS[key.tier]}</td>
                <td className="px-6 py-4 text-gray-400 text-xs">
                  {key.lastUsedAt
                    ? new Date(key.lastUsedAt).toLocaleDateString("fr-FR")
                    : "Jamais utilisée"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      key.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {key.isActive ? "Active" : "Révoquée"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {key.isActive && (
                    <button
                      onClick={() => revokeKey(key.id)}
                      disabled={revoking === key.id}
                      title="Révoquer"
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Note de sécurité */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Les clés API donnent accès à votre compte. Ne les partagez jamais publiquement.
          Authentification : <code className="bg-gray-100 px-1 rounded">Authorization: Bearer ic_live_...</code>
        </p>
      </div>
    </div>
  )
}
