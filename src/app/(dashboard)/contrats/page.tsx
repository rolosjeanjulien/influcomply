import { FileText } from "lucide-react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"

// REQ-CTR-001 — point d'entrée du module Contract Factory
export default function ContratsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Contract Factory</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Générez des contrats conformes à la loi 2023-451 et suivez les seuils de rémunération
        </p>
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-zinc-300 mb-4" />
          <CardTitle className="text-zinc-500 text-base mb-1">Module en développement</CardTitle>
          <CardDescription>Phase 4 — Templates Handlebars, wizard, Yousign, seuil €1 000 HT</CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
