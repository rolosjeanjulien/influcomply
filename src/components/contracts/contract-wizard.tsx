"use client"

// REQ-CTR-001, REQ-CTR-002, REQ-CTR-003 | SPC-CTR-001, SPC-CTR-002

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Upload, FileText, Sparkles, ChevronRight, ChevronLeft,
  Check, AlertTriangle, Loader2, ClipboardPaste, X
} from "lucide-react"
import type { ExtractedProposal } from "@/services/contracts/proposal-extractor"

type Step = "import" | "review" | "clauses" | "confirm"
const STEP_LABELS: Record<Step, string> = { import: "Proposition", review: "Vérification", clauses: "Clauses", confirm: "Confirmation" }
const STEPS: Step[] = ["import", "review", "clauses", "confirm"]

export function ContractWizard() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentStep, setCurrentStep] = useState<Step>("import")
  const [importMode, setImportMode] = useState<"pdf" | "paste">("pdf")
  const [pastedText, setPastedText] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [extracted, setExtracted] = useState<ExtractedProposal | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    creatorName: "", creatorEmail: "",
    brandName: "", brandEmail: "", brandSiret: "", brandRepresentative: "",
    collaborationType: "PAID_PARTNERSHIP" as "GIFTING" | "PAID_PARTNERSHIP" | "BRAND_AMBASSADOR",
    amount: "", startDate: "", endDate: "", deliverables: "",
    platforms: [] as string[],
  })

  const [clauses, setClauses] = useState({ ipRights: false, exclusivity: false, exclusivityMonths: "3" })

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleExtract() {
    setIsExtracting(true)
    setExtractError(null)
    try {
      const fd = new FormData()
      if (importMode === "paste") { fd.append("text", pastedText) }
      else if (selectedFile) { fd.append("file", selectedFile) }
      else { setExtractError("Veuillez sélectionner un fichier ou coller du texte."); setIsExtracting(false); return }

      const res = await fetch("/api/contracts/extract", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Erreur serveur")

      const data: ExtractedProposal = json.data
      setExtracted(data)
      setForm(prev => ({
        ...prev,
        brandName: data.brandName ?? "", brandEmail: data.brandEmail ?? "",
        brandSiret: data.brandSiret ?? "", brandRepresentative: data.brandRepresentative ?? "",
        collaborationType: data.collaborationType ?? "PAID_PARTNERSHIP",
        amount: data.amount?.toString() ?? "", startDate: data.startDate ?? "",
        endDate: data.endDate ?? "", deliverables: data.deliverables ?? "",
        platforms: data.platforms ?? [],
      }))
      setClauses(prev => ({ ...prev, ipRights: data.ipRights, exclusivity: data.exclusivity, exclusivityMonths: data.exclusivityMonths?.toString() ?? "3" }))
      setCurrentStep("review")
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally { setIsExtracting(false) }
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorName: form.creatorName, creatorEmail: form.creatorEmail,
          brandName: form.brandName, brandEmail: form.brandEmail,
          brandSiret: form.brandSiret || null, brandRepresentative: form.brandRepresentative || null,
          type: form.collaborationType,
          amount: form.amount ? parseFloat(form.amount) : null,
          startDate: form.startDate || null, endDate: form.endDate || null,
          deliverables: form.deliverables, platforms: form.platforms,
          ipRights: clauses.ipRights, exclusivity: clauses.exclusivity,
          exclusivityMonths: clauses.exclusivity ? parseInt(clauses.exclusivityMonths) : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Erreur lors de la création")
      router.push(`/contrats/${json.id}`)
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Erreur inconnue")
      setIsSubmitting(false)
    }
  }

  const currentIndex = STEPS.indexOf(currentStep)

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
      {/* Progress steps */}
      <div className="flex border-b border-zinc-100">
        {STEPS.map((step, i) => {
          const isDone = STEPS.indexOf(currentStep) > i
          const isActive = step === currentStep
          return (
            <div key={step} className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${isActive ? "text-violet-700 border-b-2 border-violet-600" : isDone ? "text-emerald-600" : "text-zinc-400"}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isDone ? "bg-emerald-100 text-emerald-600" : isActive ? "bg-violet-100 text-violet-600" : "bg-zinc-100 text-zinc-400"}`}>
                {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{STEP_LABELS[step]}</span>
            </div>
          )
        })}
      </div>

      <div className="p-6 md:p-8">
        {currentStep === "import" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Importez votre proposition commerciale</h2>
              <p className="text-sm text-zinc-500 mt-1">{"L'IA analysera la proposition et préremplira automatiquement le contrat."}</p>
            </div>
            <div className="flex gap-3">
              {(["pdf", "paste"] as const).map(mode => (
                <button key={mode} onClick={() => setImportMode(mode)} className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${importMode === mode ? "border-violet-400 bg-violet-50 text-violet-700" : "border-zinc-200 text-zinc-500 hover:border-zinc-300"}`}>
                  {mode === "pdf" ? <Upload className="h-5 w-5" /> : <ClipboardPaste className="h-5 w-5" />}
                  <span className="text-sm font-medium">{mode === "pdf" ? "PDF" : "Copier-coller"}</span>
                </button>
              ))}
            </div>
            {importMode === "pdf" && (
              <div>
                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] ?? null)} />
                {selectedFile ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-violet-50 border border-violet-200">
                    <FileText className="h-5 w-5 text-violet-500 shrink-0" />
                    <span className="text-sm text-violet-700 font-medium flex-1 truncate">{selectedFile.name}</span>
                    <button onClick={() => setSelectedFile(null)} className="text-violet-400 hover:text-violet-600"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()} className="w-full flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed border-zinc-200 hover:border-violet-300 hover:bg-violet-50 transition-all group">
                    <Upload className="h-8 w-8 text-zinc-300 group-hover:text-violet-400 transition-colors" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-zinc-600 group-hover:text-violet-600">Cliquez pour sélectionner un PDF</p>
                      <p className="text-xs text-zinc-400 mt-1">Format PDF, max 10 Mo</p>
                    </div>
                  </button>
                )}
              </div>
            )}
            {importMode === "paste" && (
              <div>
                <textarea value={pastedText} onChange={e => setPastedText(e.target.value)} placeholder="Collez ici le texte de la proposition commerciale..." className="w-full h-48 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none" />
                <p className="text-xs text-zinc-400 mt-1.5">{pastedText.length} caractères</p>
              </div>
            )}
            {extractError && <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"><AlertTriangle className="h-4 w-4 shrink-0" />{extractError}</div>}
            <div className="flex justify-end">
              <Button onClick={handleExtract} disabled={isExtracting || (importMode === "paste" ? !pastedText.trim() : !selectedFile)} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl px-6 hover:opacity-90 disabled:opacity-50">
                {isExtracting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyse en cours...</> : <><Sparkles className="h-4 w-4 mr-2" />{"Analyser avec l'IA"}</>}
              </Button>
            </div>
          </div>
        )}

        {currentStep === "review" && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Vérifiez les informations</h2>
                <p className="text-sm text-zinc-500 mt-1">Corrigez ou complétez les champs préremplis par l&apos;IA.</p>
              </div>
              {extracted && <ConfidenceBadge confidence={extracted.confidence} />}
            </div>
            {extracted?.missingFields && extracted.missingFields.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div><p className="font-medium">Champs manquants :</p><p className="text-amber-700">{extracted.missingFields.join(", ")}</p></div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Vos informations</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField label="Votre nom" value={form.creatorName} onChange={v => setField("creatorName", v)} placeholder="Marie Dupont" required />
                  <FormField label="Votre email" value={form.creatorEmail} onChange={v => setField("creatorEmail", v)} placeholder="marie@example.com" type="email" required />
                </div>
              </div>
              <div className="md:col-span-2 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Informations de la marque</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField label="Nom de la marque" value={form.brandName} onChange={v => setField("brandName", v)} placeholder="Nike France" required />
                  <FormField label="Email de contact" value={form.brandEmail} onChange={v => setField("brandEmail", v)} placeholder="contact@nike.com" type="email" />
                  <FormField label="SIRET (optionnel)" value={form.brandSiret} onChange={v => setField("brandSiret", v)} placeholder="12345678901234" />
                  <FormField label="Représentant légal" value={form.brandRepresentative} onChange={v => setField("brandRepresentative", v)} placeholder="Jean Martin" />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Type de collaboration</p>
                <div className="space-y-2">
                  {(["GIFTING", "PAID_PARTNERSHIP", "BRAND_AMBASSADOR"] as const).map(type => (
                    <label key={type} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.collaborationType === type ? "border-violet-400 bg-violet-50" : "border-zinc-200 hover:border-zinc-300"}`}>
                      <input type="radio" name="collab" value={type} checked={form.collaborationType === type} onChange={() => setField("collaborationType", type)} className="accent-violet-600" />
                      <span className="text-sm font-medium text-zinc-700">{type === "GIFTING" ? "🎁 Gifting" : type === "PAID_PARTNERSHIP" ? "💼 Partenariat rémunéré" : "⭐ Ambassadeur"}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Montant & dates</p>
                <div className="space-y-3">
                  <FormField label="Montant (€ HT)" value={form.amount} onChange={v => setField("amount", v)} placeholder="1500" type="number" />
                  <FormField label="Date de début" value={form.startDate} onChange={v => setField("startDate", v)} type="date" />
                  <FormField label="Date de fin" value={form.endDate} onChange={v => setField("endDate", v)} type="date" />
                </div>
              </div>
              <div className="md:col-span-2 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Livrables</p>
                <textarea value={form.deliverables} onChange={e => setField("deliverables", e.target.value)} placeholder="Ex : 2 posts Instagram, 3 stories, 1 reel de 30 secondes..." className="w-full h-24 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none" />
              </div>
            </div>
          </div>
        )}

        {currentStep === "clauses" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Clauses contractuelles</h2>
              <p className="text-sm text-zinc-500 mt-1">Les clauses légales obligatoires sont incluses automatiquement.</p>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-sm font-semibold text-emerald-800 mb-2 flex items-center gap-2"><Check className="h-4 w-4" />Clauses obligatoires incluses automatiquement</p>
                <ul className="text-xs text-emerald-700 space-y-1">
                  <li>• Mention publicitaire obligatoire (art. 5)</li>
                  <li>• Produits et services interdits (art. 4)</li>
                  <li>• Responsabilité solidaire (art. 3)</li>
                  <li>• Seuil de déclaration gifting 1 000 € (art. 7)</li>
                  <li>• Images retouchées (art. 5)</li>
                </ul>
              </div>
              <ClauseToggle title="Cession de droits à l'image" description="L'annonceur pourra réutiliser vos contenus sur ses propres canaux (réseaux sociaux, site web)." checked={clauses.ipRights} onChange={v => setClauses(prev => ({ ...prev, ipRights: v }))} />
              <div className="space-y-3">
                <ClauseToggle title="Clause d'exclusivité sectorielle" description="Vous vous engagez à ne pas collaborer avec des marques concurrentes pendant une période définie." checked={clauses.exclusivity} onChange={v => setClauses(prev => ({ ...prev, exclusivity: v }))} />
                {clauses.exclusivity && (
                  <div className="ml-4 flex items-center gap-3">
                    <Label className="text-sm text-zinc-600 shrink-0">Durée :</Label>
                    <select value={clauses.exclusivityMonths} onChange={e => setClauses(prev => ({ ...prev, exclusivityMonths: e.target.value }))} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-400">
                      {[1, 2, 3, 6, 12].map(m => <option key={m} value={m}>{m} mois</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === "confirm" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Récapitulatif</h2>
              <p className="text-sm text-zinc-500 mt-1">Vérifiez les informations avant de générer le contrat.</p>
            </div>
            <div className="space-y-1 rounded-xl border border-zinc-100 overflow-hidden">
              <SummaryRow label="Type" value={form.collaborationType === "GIFTING" ? "🎁 Gifting" : form.collaborationType === "PAID_PARTNERSHIP" ? "💼 Partenariat rémunéré" : "⭐ Ambassadeur"} />
              <SummaryRow label="Créateur" value={`${form.creatorName}${form.creatorEmail ? ` (${form.creatorEmail})` : ""}`} />
              <SummaryRow label="Marque" value={form.brandName} />
              {form.amount && <SummaryRow label="Montant" value={`${parseFloat(form.amount).toLocaleString("fr-FR")} € HT`} />}
              {form.startDate && <SummaryRow label="Période" value={`${form.startDate} → ${form.endDate}`} />}
              <SummaryRow label="Livrables" value={form.deliverables || "Non précisé"} />
              <SummaryRow label="Cession de droits" value={clauses.ipRights ? "Oui" : "Non"} />
              <SummaryRow label="Exclusivité" value={clauses.exclusivity ? `Oui — ${clauses.exclusivityMonths} mois` : "Non"} />
            </div>
            <div className="p-4 rounded-xl bg-violet-50 border border-violet-200 text-sm text-violet-800">
              <p className="font-medium mb-1">✨ Contrat juridique conforme</p>
              <p className="text-violet-700 text-xs">Généré avec toutes les clauses requises par la loi n° 2023-451, prêt pour signature électronique.</p>
            </div>
            {extractError && <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"><AlertTriangle className="h-4 w-4 shrink-0" />{extractError}</div>}
          </div>
        )}

        {currentStep !== "import" && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-100">
            <Button variant="ghost" onClick={() => setCurrentStep(STEPS[currentIndex - 1])} className="text-zinc-500 hover:text-zinc-800 rounded-xl">
              <ChevronLeft className="h-4 w-4 mr-1" />Retour
            </Button>
            {currentStep !== "confirm" ? (
              <Button onClick={() => setCurrentStep(STEPS[currentIndex + 1])} disabled={currentStep === "review" && (!form.creatorName || !form.brandName)} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl px-6 hover:opacity-90 disabled:opacity-50">
                Continuer<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl px-6 hover:opacity-90">
                {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Génération...</> : <><FileText className="h-4 w-4 mr-2" />Générer le contrat</>}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function FormField({ label, value, onChange, placeholder, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-zinc-600">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</Label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="rounded-xl border-zinc-200 bg-white text-sm focus:ring-violet-400 focus:border-violet-400" />
    </div>
  )
}

function ClauseToggle({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${checked ? "border-violet-400 bg-violet-50" : "border-zinc-200 hover:border-zinc-300"}`}>
      <div className={`flex h-5 w-5 shrink-0 mt-0.5 items-center justify-center rounded-md border-2 transition-all ${checked ? "border-violet-500 bg-violet-500" : "border-zinc-300"}`}>
        {checked && <Check className="h-3 w-3 text-white" />}
      </div>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="hidden" />
      <div>
        <p className="text-sm font-medium text-zinc-800">{title}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
    </label>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between px-4 py-3 bg-white even:bg-zinc-50">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-medium text-zinc-800 text-right max-w-xs">{value}</span>
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence: "high" | "medium" | "low" }) {
  const map = { high: { label: "Extraction complète", className: "bg-emerald-100 text-emerald-700" }, medium: { label: "Extraction partielle", className: "bg-amber-100 text-amber-700" }, low: { label: "Peu d'infos extraites", className: "bg-red-100 text-red-600" } }
  const s = map[confidence]
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.className}`}>{s.label}</span>
}
