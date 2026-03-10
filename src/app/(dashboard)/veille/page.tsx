import { BookOpen } from "lucide-react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"

// REQ-REG-001 — point d'entrée du module Veille réglementaire
export default function VeillePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Veille réglementaire</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Base juridique vectorisée, alertes JORF/DGCCRF et chatbot RAG
        </p>
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-12 w-12 text-zinc-300 mb-4" />
          <CardTitle className="text-zinc-500 text-base mb-1">Module en développement</CardTitle>
          <CardDescription>Phase 5 — pgvector, Claude API RAG, moteur de règles</CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
