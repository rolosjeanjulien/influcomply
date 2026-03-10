// REQ-DSH-001, REQ-DSH-002, REQ-DSH-006
// SPC-DSH-001, SPC-DSH-002, SPC-DSH-006

import Link from "next/link"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import {
  getDashboardKPIs,
  getScoreTrend,
  getNonConformityDistribution,
  getScanVolume,
} from "@/services/dashboard/dashboard-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ComplianceChart } from "@/components/dashboard/compliance-chart"
import { NcDistributionChart } from "@/components/dashboard/nc-distribution-chart"
import { ScanVolumeChart } from "@/components/dashboard/scan-volume-chart"
import { AuditReportButton } from "@/components/dashboard/audit-report-button"
import {
  ShieldCheck, ScanSearch, AlertTriangle, FileText,
  TrendingUp, TrendingDown, Minus, Plus, BadgeCheck,
} from "lucide-react"

export const metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
  if (!dbUser) redirect("/login")

  const [kpis, scoreTrend, ncDistribution, scanVolume] = await Promise.all([
    getDashboardKPIs(dbUser.id),
    getScoreTrend(dbUser.id, 90),
    getNonConformityDistribution(dbUser.id),
    getScanVolume(dbUser.id, 30),
  ])

  const name = dbUser.name ?? authUser.email?.split("@")[0] ?? "vous"

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Bonjour, {name} 👋</h1>
          <p className="text-sm text-zinc-500 mt-1">Voici votre tableau de bord de conformité</p>
        </div>
        <div className="flex gap-2">
          <AuditReportButton />
          <Button asChild>
            <Link href="/scanner/nouveau"><Plus className="h-4 w-4 mr-2" />Nouveau scan</Link>
          </Button>
        </div>
      </div>

      {/* Badge certification */}
      {kpis.badgeStatus === "CERTIFIED" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center gap-3 py-4">
            <BadgeCheck className="h-7 w-7 text-blue-600 shrink-0" />
            <div>
              <p className="font-semibold text-blue-800">Créateur certifié InfluComply</p>
              <p className="text-sm text-blue-600">
                {kpis.certifiedSince
                  ? `Certifié depuis le ${new Date(kpis.certifiedSince).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
                  : "Badge actif"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {kpis.badgeStatus === "ELIGIBLE" && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-3 py-4">
            <ShieldCheck className="h-7 w-7 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Éligible à la certification</p>
              <p className="text-sm text-green-600">Maintenez un score {'>'} 80/100 pendant 90 jours consécutifs.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Score actuel"
          value={kpis.currentScore !== null ? `${kpis.currentScore}/100` : "—"}
          icon={<ShieldCheck className="h-4 w-4 text-blue-500" />}
          trend={kpis.scoreChange}
          trendLabel="vs 7 jours"
          valueColor={
            kpis.currentScore === null ? undefined
            : kpis.currentScore >= 80 ? "text-green-600"
            : kpis.currentScore >= 50 ? "text-orange-500"
            : "text-red-500"
          }
        />
        <KpiCard
          label="Moy. 90 jours"
          value={kpis.averageScore90d !== null ? `${kpis.averageScore90d}/100` : "—"}
          icon={<TrendingUp className="h-4 w-4 text-zinc-400" />}
          sub={`${scoreTrend.length} jours de données`}
        />
        <KpiCard
          label="Non-conformités"
          value={kpis.unresolvedNonConformities}
          icon={<AlertTriangle className="h-4 w-4 text-red-400" />}
          sub={`${kpis.resolvedNonConformities} résolue${kpis.resolvedNonConformities > 1 ? "s" : ""}`}
          valueColor={kpis.unresolvedNonConformities > 0 ? "text-red-500" : "text-green-600"}
        />
        <KpiCard
          label="Contrats actifs"
          value={kpis.activeContracts}
          icon={<FileText className="h-4 w-4 text-zinc-400" />}
          sub={`${kpis.totalPublications} publication${kpis.totalPublications > 1 ? "s" : ""} scannée${kpis.totalPublications > 1 ? "s" : ""}`}
        />
      </div>

      {/* Graphiques ligne 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tendance 90j — occupe 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Score de conformité — 90 derniers jours</CardTitle>
            <CardDescription className="text-xs">Seuils : 80+ certifié · 50+ à améliorer · &lt;50 non conforme</CardDescription>
          </CardHeader>
          <CardContent>
            <ComplianceChart data={scoreTrend} />
          </CardContent>
        </Card>

        {/* Distribution NC */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Non-conformités actives</CardTitle>
            <CardDescription className="text-xs">Par type de violation</CardDescription>
          </CardHeader>
          <CardContent>
            <NcDistributionChart data={ncDistribution} />
          </CardContent>
        </Card>
      </div>

      {/* Volume de scans */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Volume de scans — 30 derniers jours</CardTitle>
        </CardHeader>
        <CardContent>
          <ScanVolumeChart data={scanVolume} />
        </CardContent>
      </Card>

      {/* Call-to-action si aucune donnée */}
      {kpis.totalScans === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ScanSearch className="h-12 w-12 text-zinc-300 mb-4" />
            <CardTitle className="text-zinc-500 text-base mb-1">Commencez par scanner une publication</CardTitle>
            <CardDescription className="mb-4">
              L'analyse prend moins d'une minute et détecte automatiquement les non-conformités.
            </CardDescription>
            <Button asChild>
              <Link href="/scanner/nouveau"><Plus className="h-4 w-4 mr-2" />Lancer mon premier scan</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function KpiCard({
  label, value, icon, trend, trendLabel, sub, valueColor,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: number | null
  trendLabel?: string
  sub?: string
  valueColor?: string
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-zinc-500 font-medium">{label}</p>
          {icon}
        </div>
        <p className={`text-2xl font-bold ${valueColor ?? "text-zinc-900"}`}>{value}</p>
        {trend !== undefined && trend !== null ? (
          <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trend > 0 ? "text-green-600" : trend < 0 ? "text-red-500" : "text-zinc-400"}`}>
            {trend > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : trend < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
            {trend > 0 ? `+${trend}` : trend} pts {trendLabel}
          </div>
        ) : sub ? (
          <p className="text-xs text-zinc-400 mt-1">{sub}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
