// REQ-CTR-001, REQ-CTR-002 | SPC-CTR-001 — Liste des contrats
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { getCreatorContracts } from "@/services/contracts/contract-service"
import { COLLABORATION_LABELS } from "@/types/contract"
import type { CollaborationType, ContractStatus } from "@/types/contract"
import Link from "next/link"
import { redirect } from "next/navigation"
import { FileText, Plus, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const STATUS_MAP: Record<ContractStatus, { label: string; className: string }> = {
  DRAFT: { label: "Brouillon", className: "bg-zinc-100 text-zinc-600" },
  PENDING_SIGNATURE: { label: "En signature", className: "bg-amber-100 text-amber-700" },
  SIGNED: { label: "Signé", className: "bg-emerald-100 text-emerald-700" },
  ACTIVE: { label: "Actif", className: "bg-emerald-100 text-emerald-700" },
  EXPIRED: { label: "Expiré", className: "bg-red-100 text-red-600" },
  TERMINATED: { label: "Résilié", className: "bg-red-100 text-red-600" },
}

export default async function ContratsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) redirect("/login")

  const params = await searchParams
  const page = parseInt(params.page ?? "1")
  const { contracts, total, limit } = await getCreatorContracts(dbUser.id, page, 20)
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Mes contrats</h1>
          <p className="text-sm text-zinc-500 mt-1">Conformes à la loi n° 2023-451</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:opacity-90 shadow-sm">
          <Link href="/contrats/nouveau">
            <Plus className="h-4 w-4 mr-2" />Nouveau contrat
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {([
          ["Total", total, "text-zinc-900", "bg-zinc-50"],
          ["Actifs / signés", contracts.filter(c => c.status === "ACTIVE" || c.status === "SIGNED").length, "text-emerald-600", "bg-emerald-50"],
          ["Brouillons", contracts.filter(c => c.status === "DRAFT").length, "text-zinc-400", "bg-zinc-50"],
        ] as [string, number, string, string][]).map(([label, value, color, bg]) => (
          <div key={label} className={`${bg} rounded-2xl border border-zinc-100 p-5`}>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-sm text-zinc-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Liste */}
      {contracts.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 mx-auto mb-4">
            <FileText className="h-6 w-6 text-violet-500" />
          </div>
          <h3 className="text-base font-semibold text-zinc-800 mb-1">Aucun contrat pour l&apos;instant</h3>
          <p className="text-sm text-zinc-500 mb-5 max-w-xs mx-auto">Importez une proposition commerciale pour générer votre premier contrat.</p>
          <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-sm hover:opacity-90">
            <Link href="/contrats/nouveau"><Plus className="h-4 w-4 mr-2" />Créer un contrat</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
          {contracts.map((contract, i) => (
            <Link key={contract.id} href={`/contrats/${contract.id}`}
              className={`flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 transition-colors ${i < contracts.length - 1 ? "border-b border-zinc-100" : ""}`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50">
                <FileText className="h-4 w-4 text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 truncate">{contract.organization.name}</p>
                <p className="text-xs text-zinc-400">{COLLABORATION_LABELS[contract.type as CollaborationType]} · {new Date(contract.createdAt).toLocaleDateString("fr-FR")}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {contract.amount && (
                  <span className="text-sm font-semibold text-zinc-700">{Number(contract.amount).toLocaleString("fr-FR")} €</span>
                )}
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_MAP[contract.status as ContractStatus]?.className}`}>
                  {STATUS_MAP[contract.status as ContractStatus]?.label}
                </span>
                <ArrowRight className="h-4 w-4 text-zinc-300" />
              </div>
            </Link>
          ))}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 px-6 py-4 border-t border-zinc-100 bg-zinc-50">
              {page > 1 && <Link href={`/contrats?page=${page - 1}`} className="px-3 py-1.5 text-sm border border-zinc-200 rounded-xl hover:bg-white">← Précédent</Link>}
              <span className="text-sm text-zinc-400">Page {page} / {totalPages}</span>
              {page < totalPages && <Link href={`/contrats?page=${page + 1}`} className="px-3 py-1.5 text-sm border border-zinc-200 rounded-xl hover:bg-white">Suivant →</Link>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
