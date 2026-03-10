// REQ-CTR-001, REQ-CTR-002, REQ-CTR-003 | SPC-CTR-002 — Page création contrat
import Link from "next/link"
import { ContractWizard } from "@/components/contracts/contract-wizard"
import { ArrowLeft } from "lucide-react"

export const metadata = { title: "Nouveau contrat — InfluComply" }

export default function NouveauContratPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/contrats"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux contrats
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">Nouveau contrat</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Wizard guidé — contrat conforme à la loi n° 2023-451 du 9 juin 2023
        </p>
      </div>
      <ContractWizard />
    </div>
  )
}
