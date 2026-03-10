import { ScanSearch } from "lucide-react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"

// REQ-SCN-001 — point d'entrée du module Scanner
export default function ScannerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Scanner de publications</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Analysez vos publications pour détecter les non-conformités (loi 2023-451)
        </p>
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <ScanSearch className="h-12 w-12 text-zinc-300 mb-4" />
          <CardTitle className="text-zinc-500 text-base mb-1">Module en développement</CardTitle>
          <CardDescription>Phase 2 — Connexion OAuth, pipeline NLP, scoring</CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
