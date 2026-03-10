import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ShieldCheck,
  ScanSearch,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"

// REQ-DSH-001, REQ-DSH-002
export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return null

  // Récupération des données du tableau de bord
  const [user, recentScans, unresolvedCount, activeContracts] =
    await Promise.all([
      prisma.user.findUnique({
        where: { supabaseId: authUser.id },
        include: {
          badge: true,
          complianceScores: {
            orderBy: { date: "desc" },
            take: 90,
          },
        },
      }),
      prisma.scanResult.findMany({
        where: {
          publication: { userId: (await prisma.user.findUnique({ where: { supabaseId: authUser.id } }))?.id ?? "" },
        },
        orderBy: { scannedAt: "desc" },
        take: 5,
        include: {
          publication: true,
          nonConformities: true,
        },
      }),
      prisma.nonConformity.count({
        where: {
          isResolved: false,
          scanResult: {
            publication: { userId: (await prisma.user.findUnique({ where: { supabaseId: authUser.id } }))?.id ?? "" },
          },
        },
      }),
      prisma.contract.count({
        where: {
          creatorId: (await prisma.user.findUnique({ where: { supabaseId: authUser.id } }))?.id ?? "",
          status: { in: ["SIGNED", "ACTIVE"] },
        },
      }),
    ])

  const scores = user?.complianceScores ?? []
  const currentScore = scores[0]?.score ?? null
  const prevScore = scores[1]?.score ?? null
  const scoreTrend =
    currentScore !== null && prevScore !== null
      ? currentScore - prevScore
      : null

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          Bonjour, {user?.name ?? authUser.email} 👋
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Voici un résumé de votre conformité aujourd'hui
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Score de conformité */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              Score de conformité
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {currentScore !== null ? `${currentScore}` : "—"}
              {currentScore !== null && (
                <span className="text-base font-normal text-zinc-400">/100</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scoreTrend !== null ? (
              <div className={`flex items-center gap-1 text-sm font-medium ${
                scoreTrend > 0 ? "text-green-600" : scoreTrend < 0 ? "text-red-500" : "text-zinc-500"
              }`}>
                {scoreTrend > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : scoreTrend < 0 ? (
                  <TrendingDown className="h-4 w-4" />
                ) : (
                  <Minus className="h-4 w-4" />
                )}
                {scoreTrend > 0 ? `+${scoreTrend}` : scoreTrend} pts vs hier
              </div>
            ) : (
              <p className="text-sm text-zinc-400">Aucun scan effectué</p>
            )}
          </CardContent>
        </Card>

        {/* Scans récents */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <ScanSearch className="h-4 w-4" />
              Scans récents
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {recentScans.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400">Sur les 5 derniers</p>
          </CardContent>
        </Card>

        {/* Non-conformités actives */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              Non-conformités
            </CardDescription>
            <CardTitle className={`text-3xl font-bold ${unresolvedCount > 0 ? "text-red-500" : "text-green-600"}`}>
              {unresolvedCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400">
              {unresolvedCount === 0 ? "Aucune en attente" : "À corriger"}
            </p>
          </CardContent>
        </Card>

        {/* Contrats actifs */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              Contrats actifs
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{activeContracts}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400">Signés ou en cours</p>
          </CardContent>
        </Card>
      </div>

      {/* Badge de certification */}
      {user?.badge && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle className="text-blue-800">
                  {user.badge.status === "CERTIFIED"
                    ? "Créateur certifié InfluComply"
                    : user.badge.status === "ELIGIBLE"
                    ? "Éligible à la certification"
                    : "Certification révoquée"}
                </CardTitle>
                <CardDescription className="text-blue-600">
                  {user.badge.status === "CERTIFIED" &&
                    user.badge.certifiedSince &&
                    `Certifié depuis le ${new Date(user.badge.certifiedSince).toLocaleDateString("fr-FR")}`}
                  {user.badge.status === "ELIGIBLE" &&
                    "Maintenez votre score > 80/100 pendant 90 jours"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Scans récents */}
      {recentScans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Derniers scans</CardTitle>
            <CardDescription>Publications analysées récemment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-zinc-100">
              {recentScans.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-700 truncate max-w-xs">
                      {scan.publication.url ?? scan.publication.platform}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date(scan.scannedAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {scan.nonConformities.length > 0 && (
                      <span className="text-xs text-red-500 font-medium">
                        {scan.nonConformities.length} alerte{scan.nonConformities.length > 1 ? "s" : ""}
                      </span>
                    )}
                    <span
                      className={`text-sm font-bold ${
                        scan.score >= 80
                          ? "text-green-600"
                          : scan.score >= 50
                          ? "text-orange-500"
                          : "text-red-500"
                      }`}
                    >
                      {scan.score}/100
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* État initial (aucun scan) */}
      {recentScans.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ScanSearch className="h-12 w-12 text-zinc-300 mb-4" />
            <CardTitle className="text-zinc-500 text-base mb-1">
              Aucune publication scannée
            </CardTitle>
            <CardDescription>
              Connectez vos comptes sociaux ou importez une publication pour
              analyser sa conformité.
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
