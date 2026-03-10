import { BadgeCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"

// REQ-CRT-001 — point d'entrée du module Certification & Badge
export default function CertificationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Certification & Badge</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Badge "InfluComply Certified" — score {'>'} 80/100 sur 90 jours consécutifs
        </p>
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <BadgeCheck className="h-12 w-12 text-zinc-300 mb-4" />
          <CardTitle className="text-zinc-500 text-base mb-1">Module en développement</CardTitle>
          <CardDescription>Phase 6 — Badge engine Trigger.dev, annuaire public, API vérification</CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
