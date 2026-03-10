// REQ-SCN-003, REQ-DSH-005 — liste des publications scannées avec filtres

import Link from "next/link"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { getUserPublications } from "@/services/scanner/scan-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ScanSearch, AlertTriangle, CheckCircle2, Clock } from "lucide-react"
import { ScoreBadge } from "@/components/scanner/score-badge"
import { PlatformIcon } from "@/components/scanner/platform-icon"

export const metadata = { title: "Scanner" }

export default async function ScannerPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  const user = await prisma.user.findUnique({ where: { supabaseId: authUser.id } })
  if (!user) redirect("/login")

  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1"))

  const { publications, total, limit } = await getUserPublications(user.id, page)
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Scanner de publications</h1>
          <p className="text-sm text-zinc-500 mt-1">Analysez vos publications selon la loi 2023-451</p>
        </div>
        <Button asChild>
          <Link href="/scanner/nouveau">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau scan
          </Link>
        </Button>
      </div>

      {total > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Publications scannées" value={total} icon={<ScanSearch className="h-4 w-4 text-blue-500" />} />
          <StatCard
            label="Non-conformités actives"
            value={publications.flatMap((p) => p.scanResults).flatMap((s) => s.nonConformities).length}
            icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
            variant="danger"
          />
          <StatCard
            label="Publications conformes"
            value={publications.filter((p) => { const s = p.scanResults[0]; return s && s.score >= 80 && s.nonConformities.length === 0 }).length}
            icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
            variant="success"
          />
        </div>
      )}

      {publications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ScanSearch className="h-12 w-12 text-zinc-300 mb-4" />
            <CardTitle className="text-zinc-500 text-base mb-2">Aucune publication scannée</CardTitle>
            <CardDescription className="mb-4">Importez une publication pour analyser sa conformité réglementaire.</CardDescription>
            <Button asChild>
              <Link href="/scanner/nouveau"><Plus className="h-4 w-4 mr-2" />Scanner ma première publication</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Publications ({total})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-100">
              {publications.map((pub) => {
                const lastScan = pub.scanResults[0]
                const ncCount = lastScan?.nonConformities.length ?? 0
                return (
                  <div key={pub.id} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors">
                    <PlatformIcon platform={pub.platform} className="h-5 w-5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 truncate">
                        {pub.url ?? pub.content?.slice(0, 80) ?? "Publication sans texte"}
                        {(pub.content?.length ?? 0) > 80 ? "…" : ""}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {new Date(pub.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}
                        {pub.importMethod === "MANUAL_URL" ? "URL" : pub.importMethod === "MANUAL_TEXT" ? "Texte manuel" : pub.importMethod}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {!lastScan && <span className="flex items-center gap-1 text-xs text-zinc-400"><Clock className="h-3.5 w-3.5" />En attente</span>}
                      {lastScan?.status === "PROCESSING" && <span className="flex items-center gap-1 text-xs text-blue-500"><Clock className="h-3.5 w-3.5 animate-pulse" />En cours…</span>}
                      {ncCount > 0 && <span className="text-xs font-medium text-red-500">{ncCount} alerte{ncCount > 1 ? "s" : ""}</span>}
                      {lastScan?.status === "COMPLETED" && <ScoreBadge score={lastScan.score} />}
                      {lastScan && <Button variant="ghost" size="sm" asChild><Link href={`/scanner/${lastScan.id}`}>Voir</Link></Button>}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && <Button variant="outline" size="sm" asChild><Link href={`/scanner?page=${page - 1}`}>Précédent</Link></Button>}
          <span className="text-sm text-zinc-500 self-center">Page {page} / {totalPages}</span>
          {page < totalPages && <Button variant="outline" size="sm" asChild><Link href={`/scanner?page=${page + 1}`}>Suivant</Link></Button>}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, variant = "default" }: { label: string; value: number; icon: React.ReactNode; variant?: "default" | "danger" | "success" }) {
  const colors = { default: "text-zinc-900", danger: value > 0 ? "text-red-500" : "text-zinc-900", success: "text-green-600" }
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-1"><p className="text-xs text-zinc-500">{label}</p>{icon}</div>
        <p className={`text-2xl font-bold ${colors[variant]}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
