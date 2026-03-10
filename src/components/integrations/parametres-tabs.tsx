"use client"
// REQ-INT-001, REQ-INT-002 | Onglets de navigation des paramètres

import { useState } from "react"
import type { ReactNode } from "react"
import { User, Key, Webhook, BookOpen } from "lucide-react"

interface ProfileData {
  name: string
  email: string
  slug: string
  isPublic: boolean
  organization: { name: string; siret: string } | null
}

interface ParametresTabsProps {
  profile: ProfileData
  apiKeysPanel: ReactNode
  webhooksPanel: ReactNode
}

type Tab = "profile" | "api" | "webhooks" | "docs"

function ProfilePanel({ profile }: { profile: ProfileData }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <User className="h-5 w-5 text-gray-500" />
          Informations du compte
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            ["Nom", profile.name || "—"],
            ["Email", profile.email],
            ["Identifiant public", profile.slug || "Non défini"],
            ["Profil public", profile.isPublic ? "Oui" : "Non"],
          ].map(([label, value]) => (
            <div key={label} className="space-y-1">
              <div className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</div>
              <div className="text-gray-900 font-medium">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {profile.organization && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Organisation</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ["Nom", profile.organization.name],
              ["SIRET", profile.organization.siret || "—"],
            ].map(([label, value]) => (
              <div key={label} className="space-y-1">
                <div className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</div>
                <div className="text-gray-900 font-medium">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DocsPanel() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-blue-600" />
        Documentation API
      </h2>

      <div className="space-y-5">
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="font-medium text-blue-900 mb-1">API v1 — REST</div>
          <div className="text-sm text-blue-700 mb-3">
            Base URL : <code className="bg-white px-1.5 py-0.5 rounded font-mono text-xs">https://influcomply.fr/api/v1</code>
          </div>
          <a
            href="/api/v1/docs"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Voir la spécification OpenAPI 3.0 →
          </a>
        </div>

        <div className="space-y-3 text-sm">
          <h3 className="font-medium text-gray-700">Endpoints disponibles</h3>
          {[
            ["POST", "/api/v1/scan", "Analyser un contenu"],
            ["GET",  "/api/v1/scan", "Lister les scans"],
            ["POST", "/api/v1/contracts", "Créer un contrat"],
            ["GET",  "/api/v1/contracts", "Lister les contrats"],
            ["GET",  "/api/v1/verify/:slug", "Vérifier un badge (enrichi)"],
            ["GET",  "/api/public/verify/:slug", "Vérifier un badge (public, sans auth)"],
            ["GET",  "/api/public/badge/:slug", "Badge SVG embarquable"],
          ].map(([method, path, label]) => (
            <div key={path + method} className="flex items-center gap-3">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded font-mono w-12 text-center ${
                  method === "GET" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                }`}
              >
                {method}
              </span>
              <code className="text-xs text-gray-600">{path}</code>
              <span className="text-gray-400 text-xs">{label}</span>
            </div>
          ))}
        </div>

        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="font-medium text-gray-700 mb-2 text-sm">Authentification</div>
          <pre className="text-xs text-gray-600 font-mono bg-white rounded p-3 border border-gray-200 overflow-x-auto">
{`curl https://influcomply.fr/api/v1/scan \\
  -H "Authorization: Bearer ic_live_XXXXXXXX" \\
  -H "Content-Type: application/json" \\
  -d '{"platform":"INSTAGRAM","importMethod":"TEXT","content":"..."}'`}
          </pre>
        </div>

        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
          <div className="font-medium text-purple-900 mb-1 text-sm">Vérification des webhooks</div>
          <pre className="text-xs text-purple-700 font-mono overflow-x-auto">
{`const signature = req.headers['x-influcomply-signature']
// signature = "sha256=<hmac>"
const expected = "sha256=" + createHmac("sha256", secret)
  .update(rawBody).digest("hex")
if (signature !== expected) return 401`}
          </pre>
        </div>
      </div>
    </div>
  )
}

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "profile",  label: "Profil",       icon: <User className="h-4 w-4" /> },
  { id: "api",      label: "Clés API",     icon: <Key className="h-4 w-4" /> },
  { id: "webhooks", label: "Webhooks",     icon: <Webhook className="h-4 w-4" /> },
  { id: "docs",     label: "Documentation",icon: <BookOpen className="h-4 w-4" /> },
]

export function ParametresTabs({ profile, apiKeysPanel, webhooksPanel }: ParametresTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile")

  return (
    <div>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile"  && <ProfilePanel profile={profile} />}
      {activeTab === "api"      && apiKeysPanel}
      {activeTab === "webhooks" && webhooksPanel}
      {activeTab === "docs"     && <DocsPanel />}
    </div>
  )
}
