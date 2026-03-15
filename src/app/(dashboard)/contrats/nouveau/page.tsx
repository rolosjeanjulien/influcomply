// REQ-CTR-001, REQ-CTR-002, REQ-CTR-003 | SPC-CTR-002 — Page création contrat
import Link from "next/link"
import { ContractWizard } from "@/components/contracts/contract-wizard"
import { ArrowLeft } from "lucide-react"

export const metadata = { title: "Nouveau contrat — InfluComply" }

export default function NouveauContratPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/contrats"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-700 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux contrats
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">Nouveau contrat</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Importez une proposition commerciale — l&apos;IA préremplie le contrat pour vous.
        </p>
      </div>
      <ContractWizard />
    </div>
  )
}
