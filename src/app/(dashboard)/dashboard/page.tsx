import Link from "next/link"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { FileText, Plus, Clock, CheckCircle2, PenLine, Sparkles, ArrowRight } from "lucide-react"

export const metadata = { title: "Accueil — InfluComply" }

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && key && url !== "https://placeholder.supabase.co" && key !== "placeholder" && url.includes(".supabase.co"))
}

export default async function DashboardPage() {
  let dbUser = null

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) redirect("/login")
    dbUser = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
      include: {
        contracts: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    })
  }

  const contracts = dbUser?.contracts ?? []
  const name = dbUser?.name ?? "vous"

  const stats = {
    total: contracts.length,
    draft: contracts.filter(c => c.status === "DRAFT").length,
    pending: contracts.filter(c => c.status === "PENDING_SIGNATURE").length,
    signed: contracts.filter(c => c.status === "SIGNED" || c.status === "ACTIVE").length,
  }

  return (
    <div className="space-y-8">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-700 p-8 text-white shadow-lg">
        <div className="relative z-10">
          <p className="text-violet-200 text-sm font-medium mb-1">Bonjour 👋</p>
          <h1 className="text-2xl font-bold mb-2">Bienvenue sur InfluComply, {name}</h1>
          <p className="text-violet-200 text-sm max-w-lg">
            Gérez vos contrats de collaboration en toute conformité avec la loi n° 2023-451.
            Générez des contrats juridiques en quelques clics.
          </p>
          <div className="flex gap-3 mt-6">
            <Button asChild className="bg-white text-violet-700 hover:bg-violet-50 font-semibold shadow-sm rounded-xl">
              <Link href="/contrats/nouveau">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau contrat
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 rounded-xl border border-white/20">
              <Link href="/veille">
                <Sparkles className="h-4 w-4 mr-2" />
                Assistant IA
              </Link>
            </Button>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -right-4 -bottom-8 h-56 w-56 rounded-full bg-white/5" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total contrats"
          value={stats.total}
          icon={<FileText className="h-5 w-5 text-violet-500" />}
          bg="bg-violet-50"
        />
        <StatCard
          label="En attente de signature"
          value={stats.pending}
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          bg="bg-amber-50"
        />
        <StatCard
          label="Signés"
          value={stats.signed}
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          bg="bg-emerald-50"
        />
      </div>

      {/* Recent contracts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-900">Contrats récents</h2>
          <Link href="/contrats" className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
            Voir tout <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {contracts.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 mx-auto mb-4">
              <PenLine className="h-6 w-6 text-violet-500" />
            </div>
            <h3 className="text-base font-semibold text-zinc-800 mb-1">Aucun contrat pour l&apos;instant</h3>
            <p className="text-sm text-zinc-500 mb-5 max-w-xs mx-auto">
              Créez votre premier contrat en important une proposition commerciale.
            </p>
            <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-sm hover:opacity-90">
              <Link href="/contrats/nouveau">
                <Plus className="h-4 w-4 mr-2" />
                Créer mon premier contrat
              </Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
            {contracts.map((contract, i) => (
              <Link
                key={contract.id}
                href={`/contrats/${contract.id}`}
                className={`flex items-center justify-between px-5 py-4 hover:bg-zinc-50 transition-colors ${i < contracts.length - 1 ? "border-b border-zinc-100" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
                    <FileText className="h-4 w-4 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {contract.type === "GIFTING" ? "Gifting" : contract.type === "PAID_PARTNERSHIP" ? "Partenariat rémunéré" : "Ambassadeur"}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {new Date(contract.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {contract.amount && (
                    <span className="text-sm font-semibold text-zinc-700">
                      {contract.amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                    </span>
                  )}
                  <StatusBadge status={contract.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, bg }: { label: string; value: number; icon: React.ReactNode; bg: string }) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    DRAFT: { label: "Brouillon", className: "bg-zinc-100 text-zinc-600" },
    PENDING_SIGNATURE: { label: "En signature", className: "bg-amber-100 text-amber-700" },
    SIGNED: { label: "Signé", className: "bg-emerald-100 text-emerald-700" },
    ACTIVE: { label: "Actif", className: "bg-emerald-100 text-emerald-700" },
    EXPIRED: { label: "Expiré", className: "bg-red-100 text-red-600" },
    TERMINATED: { label: "Résilié", className: "bg-red-100 text-red-600" },
  }
  const s = map[status] ?? { label: status, className: "bg-zinc-100 text-zinc-600" }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.className}`}>{s.label}</span>
  )
}
