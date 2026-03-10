// REQ-SCN-006, REQ-SCN-007, REQ-SCN-008 — page de résultat d'un scan
// Affiche le score, la décomposition et les non-conformités avec suggestions

import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { getScanResult } from "@/services/scanner/scan-service"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScoreBadge } from "@/components/scanner/score-badge"
import { PlatformLabel } from "@/components/scanner/platform-icon"
import { NonConformityCard } from "@/components/scanner/non-conformity-card"
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  ExternalLink,
} from "lucide-react"

export const metadata = { title: "Résultat du scan" }

export default async function ScanResultPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createSupabaseServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  })
  if (!user) redirect("/login")

  const result = await getScanResult(id, user.id)
  if (!result) notFound()

  const { score, adMentionScore, prohibitedScore, retouchScore } = result
  const unresolvedCount = result.nonConformities.filter(
    (nc) => !nc.isResolved
  ).length
  const resolvedCount = result.nonConformities.filter(
    (nc) => nc.isResolved
  ).length

  // Icône et couleur selon le score
  const ScoreIcon =
    score >= 80 ? CheckCircle2 : score >= 50 ? AlertTriangle : XCircle
  const scoreColor =
    score >= 80
      ? "text-green-600"
      : score >= 50
      ? "text-orange-500"
      : "text-red-500"

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Retour */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/scanner">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour aux publications
        </Link>
      </Button>

      {/* En-tête résultat */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <ScoreIcon className={cn("h-5 w-5", scoreColor)} />
                Résultat de l'analyse
              </CardTitle>
              <CardDescription className="flex items-center gap-3">
                <PlatformLabel platform={result.publication.platform} />
                <span className="text-zinc-300">·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(result.scannedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {result.publication.url && (
                  <>
                    <span className="text-zinc-300">·</span>
                    <a
                      href={result.publication.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      Voir la publication
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </>
                )}
              </CardDescription>
            </div>
            <ScoreBadge score={score} size="lg" showLabel />
          </div>
        </CardHeader>

        {/* Décomposition du score */}
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <ScoreBar
              label="Mentions publicitaires"
              score={adMentionScore ?? 0}
              max={40}
              legalRef="Art. 5"
            />
            <ScoreBar
              label="Produits interdits"
              score={prohibitedScore ?? 0}
              max={30}
              legalRef="Art. 3"
            />
            <ScoreBar
              label="Images retouchées"
              score={retouchScore ?? 0}
              max={15}
              legalRef="Art. 9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Non-conformités */}
      {result.nonConformities.length === 0 ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-3 py-6">
            <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">
                Aucune non-conformité détectée
              </p>
              <p className="text-sm text-green-600">
                Cette publication est conforme à la loi 2023-451.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900">
              Non-conformités détectées ({unresolvedCount} active
              {unresolvedCount > 1 ? "s" : ""}
              {resolvedCount > 0 ? `, ${resolvedCount} résolue${resolvedCount > 1 ? "s" : ""}` : ""})
            </h2>
          </div>
          {result.nonConformities.map((nc) => (
            <NonConformityCard key={nc.id} nonConformity={nc} scanId={id} />
          ))}
        </div>
      )}

      {/* Texte analysé */}
      {result.publication.content && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-600">
              Contenu analysé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
              {result.publication.content}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ScoreBar({
  label,
  score,
  max,
  legalRef,
}: {
  label: string
  score: number
  max: number
  legalRef: string
}) {
  const pct = Math.round((score / max) * 100)
  const barColor =
    pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-orange-400" : "bg-red-500"

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <p className="text-xs font-medium text-zinc-600 truncate">{label}</p>
        <span className="text-xs text-zinc-400 shrink-0 ml-1">{legalRef}</span>
      </div>
      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-zinc-500 text-right">
        {score}/{max} pts
      </p>
    </div>
  )
}

// Helper cn local (évite d'importer depuis utils pour ce fichier)
function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
