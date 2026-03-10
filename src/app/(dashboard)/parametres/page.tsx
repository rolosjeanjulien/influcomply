import { Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"

export default function ParametresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Paramètres</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Gérez votre compte, vos notifications et vos intégrations
        </p>
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Settings className="h-12 w-12 text-zinc-300 mb-4" />
          <CardTitle className="text-zinc-500 text-base mb-1">Module en développement</CardTitle>
          <CardDescription>Profil, notifications, clés API, webhooks</CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
