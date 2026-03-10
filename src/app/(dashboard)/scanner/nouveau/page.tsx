// REQ-SCN-002, REQ-SCN-003 — formulaire de scan (URL ou texte manuel)
// SPC-SCN-003 — import manuel

import { NewScanForm } from "@/components/scanner/new-scan-form"

export const metadata = { title: "Nouveau scan" }

export default function NouveauScanPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Nouveau scan</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Analysez une publication pour détecter les non-conformités (loi 2023-451)
        </p>
      </div>
      <NewScanForm />
    </div>
  )
}
