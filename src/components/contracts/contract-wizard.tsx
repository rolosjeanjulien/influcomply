"use client"
// REQ-CTR-001, REQ-CTR-002, REQ-CTR-003 | SPC-CTR-002 — Wizard 5 étapes création contrat

import { useState } from "react"
import { useRouter } from "next/navigation"
import { COLLABORATION_LABELS, type CollaborationType, type SiretVerificationResult } from "@/types/contract"

// ─── Types locaux ──────────────────────────────────────────────────────────

interface WizardData {
  type: CollaborationType | ""
  creatorName: string
  creatorEmail: string
  brandName: string
  brandEmail: string
  brandSiret: string
  amount: string
  currency: string
  startDate: string
  endDate: string
  deliverables: string
  hasIpClause: boolean
  hasJointLiabilityClause: boolean
  hasExclusivityClause: boolean
  exclusivityMonths: string
}

const DEFAULT_DATA: WizardData = {
  type: "",
  creatorName: "",
  creatorEmail: "",
  brandName: "",
  brandEmail: "",
  brandSiret: "",
  amount: "",
  currency: "EUR",
  startDate: "",
  endDate: "",
  deliverables: "",
  hasIpClause: true,
  hasJointLiabilityClause: true, // obligatoire loi 2023-451
  hasExclusivityClause: false,
  exclusivityMonths: "",
}

const STEPS = [
  "Type de collaboration",
  "Parties",
  "Conditions",
  "Clauses",
  "Récapitulatif",
]

// ─── Indicateur de progression ────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              i < current
                ? "bg-green-500 text-white"
                : i === current
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {i < current ? "✓" : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-12 ${i < current ? "bg-green-500" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Étape 1 — Type de collaboration ─────────────────────────────────────

function Step1({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  const ICONS: Record<CollaborationType, string> = {
    GIFTING: "🎁",
    PAID_PARTNERSHIP: "💼",
    BRAND_AMBASSADOR: "⭐",
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Type de collaboration</h2>
      <p className="text-gray-500 text-sm mb-6">
        Sélectionnez le type de partenariat. Le contrat sera adapté automatiquement.
      </p>
      <div className="grid grid-cols-1 gap-4">
        {(Object.keys(COLLABORATION_LABELS) as CollaborationType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange({ type })}
            className={`flex items-center gap-4 p-4 border-2 rounded-xl text-left transition-all ${
              data.type === type
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
            }`}
          >
            <span className="text-3xl">{ICONS[type]}</span>
            <div>
              <div className="font-medium">{COLLABORATION_LABELS[type]}</div>
              <div className="text-sm text-gray-500">
                {type === "GIFTING" && "Envoi de produits sans contrepartie financière directe"}
                {type === "PAID_PARTNERSHIP" && "Collaboration avec rémunération monétaire"}
                {type === "BRAND_AMBASSADOR" && "Relation long terme avec exclusivité possible"}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Étape 2 — Parties ────────────────────────────────────────────────────

function Step2({
  data,
  onChange,
}: {
  data: WizardData
  onChange: (d: Partial<WizardData>) => void
}) {
  const [siretResult, setSiretResult] = useState<SiretVerificationResult | null>(null)
  const [siretLoading, setSiretLoading] = useState(false)

  async function checkSiret() {
    if (!/^\d{14}$/.test(data.brandSiret)) return
    setSiretLoading(true)
    try {
      const res = await fetch(`/api/siret/${data.brandSiret}`)
      const json = await res.json()
      setSiretResult(json)
      if (json.company?.name) onChange({ brandName: json.company.name })
    } catch {
      setSiretResult(null)
    } finally {
      setSiretLoading(false)
    }
  }

  const field = (label: string, key: keyof WizardData, type = "text", placeholder = "") => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={data[key] as string}
        onChange={(e) => onChange({ [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
      />
    </div>
  )

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Parties au contrat</h2>
      <p className="text-gray-500 text-sm mb-6">Renseignez les coordonnées du créateur et de la marque.</p>

      <div className="space-y-6">
        <div className="p-4 bg-blue-50 rounded-xl">
          <h3 className="font-medium text-blue-800 mb-3">Créateur de contenu</h3>
          <div className="grid grid-cols-2 gap-3">
            {field("Nom complet", "creatorName", "text", "Ex: Marie Dupont")}
            {field("Email", "creatorEmail", "email", "marie@example.com")}
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl">
          <h3 className="font-medium text-gray-700 mb-3">Marque / Annonceur</h3>
          <div className="grid grid-cols-2 gap-3">
            {field("Nom de la marque", "brandName", "text", "Ex: Marque SAS")}
            {field("Email", "brandEmail", "email", "contact@marque.fr")}
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SIRET <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={14}
                value={data.brandSiret}
                onChange={(e) => {
                  onChange({ brandSiret: e.target.value.replace(/\D/g, "") })
                  setSiretResult(null)
                }}
                placeholder="14 chiffres"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={checkSiret}
                disabled={!/^\d{14}$/.test(data.brandSiret) || siretLoading}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-40 hover:bg-blue-700 transition-colors"
              >
                {siretLoading ? "..." : "Vérifier"}
              </button>
            </div>
            {siretResult && (
              <div
                className={`mt-2 p-3 rounded-lg text-sm ${
                  siretResult.isValid && siretResult.company?.isActive
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {siretResult.isValid && siretResult.company ? (
                  <>
                    <div className="font-medium">{siretResult.company.name}</div>
                    <div className="text-xs mt-1 opacity-75">{siretResult.company.address}</div>
                    {!siretResult.company.isActive && (
                      <div className="mt-1 font-medium">⚠ Entreprise fermée</div>
                    )}
                  </>
                ) : (
                  <div>SIRET invalide ou introuvable</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Étape 3 — Conditions ─────────────────────────────────────────────────

function Step3({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Conditions commerciales</h2>
      <p className="text-gray-500 text-sm mb-6">Renseignez les modalités financières et temporelles.</p>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant (€)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={data.amount}
              onChange={(e) => onChange({ amount: e.target.value })}
              placeholder="Ex: 500"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
            <select
              value={data.currency}
              onChange={(e) => onChange({ currency: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="EUR">EUR €</option>
              <option value="USD">USD $</option>
              <option value="GBP">GBP £</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
            <input
              type="date"
              value={data.startDate}
              onChange={(e) => onChange({ startDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
            <input
              type="date"
              value={data.endDate}
              onChange={(e) => onChange({ endDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Livrables attendus</label>
          <textarea
            value={data.deliverables}
            onChange={(e) => onChange({ deliverables: e.target.value })}
            rows={4}
            placeholder="Ex: 2 posts Instagram + 1 Reel + 3 Stories dans la semaine du 15 mars..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Étape 4 — Clauses ────────────────────────────────────────────────────

function Step4({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  const clause = (
    key: keyof WizardData,
    label: string,
    description: string,
    mandatory = false
  ) => (
    <div
      className={`flex items-start gap-3 p-4 border rounded-xl ${
        mandatory ? "border-blue-200 bg-blue-50" : "border-gray-200"
      }`}
    >
      <input
        type="checkbox"
        id={key}
        checked={data[key] as boolean}
        disabled={mandatory}
        onChange={(e) => onChange({ [key]: e.target.checked })}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
      />
      <label htmlFor={key} className="flex-1">
        <div className="font-medium text-sm">
          {label}
          {mandatory && (
            <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
              Obligatoire (loi 2023-451)
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">{description}</div>
      </label>
    </div>
  )

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Clauses contractuelles</h2>
      <p className="text-gray-500 text-sm mb-6">
        Sélectionnez les clauses à inclure dans le contrat. Les clauses obligatoires sont pré-cochées.
      </p>

      <div className="space-y-3">
        {clause(
          "hasJointLiabilityClause",
          "Clause de responsabilité solidaire",
          "Art. 7 loi 2023-451 — Responsabilité partagée créateur/annonceur pour les contenus non conformes",
          true
        )}
        {clause(
          "hasIpClause",
          "Droits de propriété intellectuelle",
          "Définit les droits d'utilisation des contenus créés (durée, territoires, supports)"
        )}
        {clause(
          "hasExclusivityClause",
          "Clause d'exclusivité",
          "Interdit au créateur de collaborer avec des marques concurrentes pendant la durée définie"
        )}

        {data.hasExclusivityClause && (
          <div className="ml-7 pl-4 border-l-2 border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Durée d&apos;exclusivité (mois)
            </label>
            <input
              type="number"
              min="1"
              max="36"
              value={data.exclusivityMonths}
              onChange={(e) => onChange({ exclusivityMonths: e.target.value })}
              placeholder="Ex: 3"
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Étape 5 — Récapitulatif ──────────────────────────────────────────────

function Step5({ data }: { data: WizardData }) {
  const row = (label: string, value: string | undefined | null) =>
    value ? (
      <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
    ) : null

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Récapitulatif</h2>
      <p className="text-gray-500 text-sm mb-6">
        Vérifiez les informations avant de créer le contrat.
      </p>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-xl">
          <h3 className="font-medium text-gray-700 mb-2">Type</h3>
          {row("Collaboration", data.type ? COLLABORATION_LABELS[data.type as CollaborationType] : "")}
        </div>

        <div className="p-4 bg-gray-50 rounded-xl">
          <h3 className="font-medium text-gray-700 mb-2">Parties</h3>
          {row("Créateur", `${data.creatorName} (${data.creatorEmail})`)}
          {row("Marque", `${data.brandName} (${data.brandEmail})`)}
          {row("SIRET", data.brandSiret || null)}
        </div>

        <div className="p-4 bg-gray-50 rounded-xl">
          <h3 className="font-medium text-gray-700 mb-2">Conditions</h3>
          {row("Montant", data.amount ? `${data.amount} ${data.currency}` : "Non rémunéré")}
          {row("Début", data.startDate || null)}
          {row("Fin", data.endDate || null)}
          {row("Livrables", data.deliverables || null)}
        </div>

        <div className="p-4 bg-gray-50 rounded-xl">
          <h3 className="font-medium text-gray-700 mb-2">Clauses</h3>
          {row("Responsabilité solidaire", "Oui (obligatoire)")}
          {row("Droits PI", data.hasIpClause ? "Incluse" : "Exclue")}
          {row(
            "Exclusivité",
            data.hasExclusivityClause
              ? `${data.exclusivityMonths} mois`
              : "Non"
          )}
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          En créant ce contrat, les clauses légales obligatoires de la loi n° 2023-451 du 9 juin 2023
          (art. 3, 5 et 7) seront automatiquement intégrées au document final.
        </div>
      </div>
    </div>
  )
}

// ─── Wizard principal ─────────────────────────────────────────────────────

export function ContractWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>(DEFAULT_DATA)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(partial: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...partial }))
  }

  function canProceed(): boolean {
    if (step === 0) return !!data.type
    if (step === 1)
      return (
        data.creatorName.length >= 2 &&
        /\S+@\S+\.\S+/.test(data.creatorEmail) &&
        data.brandName.length >= 2 &&
        /\S+@\S+\.\S+/.test(data.brandEmail)
      )
    return true
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        type: data.type,
        creatorName: data.creatorName,
        creatorEmail: data.creatorEmail,
        brandName: data.brandName,
        brandEmail: data.brandEmail,
        brandSiret: data.brandSiret || undefined,
        amount: data.amount ? parseFloat(data.amount) : undefined,
        currency: data.currency,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        deliverables: data.deliverables || undefined,
        hasIpClause: data.hasIpClause,
        hasJointLiabilityClause: true,
        hasExclusivityClause: data.hasExclusivityClause,
        exclusivityMonths: data.exclusivityMonths ? parseInt(data.exclusivityMonths) : undefined,
      }

      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Erreur lors de la création")
      }

      const { contract } = await res.json()
      router.push(`/contrats/${contract.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inattendue")
    } finally {
      setLoading(false)
    }
  }

  const STEP_COMPONENTS = [
    <Step1 key="s1" data={data} onChange={update} />,
    <Step2 key="s2" data={data} onChange={update} />,
    <Step3 key="s3" data={data} onChange={update} />,
    <Step4 key="s4" data={data} onChange={update} />,
    <Step5 key="s5" data={data} />,
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator current={step} total={STEPS.length} />

      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        {STEP_COMPONENTS[step]}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => (step === 0 ? router.push("/contrats") : setStep(step - 1))}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {step === 0 ? "Annuler" : "← Précédent"}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-40 hover:bg-blue-700 transition-colors"
            >
              Suivant →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg disabled:opacity-40 hover:bg-green-700 transition-colors"
            >
              {loading ? "Création en cours..." : "Créer le contrat"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
