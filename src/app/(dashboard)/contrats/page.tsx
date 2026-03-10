// REQ-CTR-001, REQ-CTR-002 | SPC-CTR-001 — Liste des contrats
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { getCreatorContracts } from "@/services/contracts/contract-service"
import { getThresholdStatus } from "@/services/contracts/threshold-service"
import { STATUS_LABELS, COLLABORATION_LABELS } from "@/types/contract"
import type { CollaborationType, ContractStatus } from "@/types/contract"
import Link from "next/link"
import { redirect } from "next/navigation"
import { FileText, Plus, AlertTriangle, CheckCircle } from "lucide-react"

const STATUS_COLORS: Record<ContractStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PENDING_SIGNATURE: "bg-amber-100 text-amber-700",
  SIGNED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  EXPIRED: "bg-red-100 text-red-600",
  TERMINATED: "bg-red-100 text-red-600",
}

export default async function ContratsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) redirect("/login")

  const params = await searchParams
  const page = parseInt(params.page ?? "1")
  const { contracts, total, limit } = await getCreatorContracts(dbUser.id, page, 20)

  // Seuil de rémunération (si l'utilisateur est dans une org)
  const orgMember = await prisma.organizationMember.findFirst({
    where: { userId: dbUser.id },
    include: { organization: true },
  })
  const threshold = orgMember
    ? await getThresholdStatus(dbUser.id, orgMember.organizationId)
    : null

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Contract Factory</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Contrats conformes à la loi n° 2023-451 du 9 juin 2023
          </p>
        </div>
        <Link
          href="/contrats/nouveau"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouveau contrat
        </Link>
      </div>

      {/* Alerte seuil €1000 */}
      {threshold && (threshold.isWarning || threshold.isMandatory) && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border ${
            threshold.isMandatory
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium">
              {threshold.isMandatory
                ? "Seuil de 1 000 € HT atteint — contrat obligatoire"
                : `Attention : ${threshold.totalAmount.toFixed(0)} € HT cumulés cette année`}
            </div>
            <div className="text-sm mt-1 opacity-80">
              {threshold.isMandatory
                ? "La loi 2023-451 impose un contrat écrit au-delà de 1 000 € de rémunération annuelle."
                : `Il vous reste ${threshold.remaining.toFixed(0)} € avant l'obligation contractuelle.`}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(
          [
            ["Total", total, "text-zinc-900"],
            ["Actifs", contracts.filter((c) => c.status === "ACTIVE").length, "text-green-600"],
            ["Brouillons", contracts.filter((c) => c.status === "DRAFT").length, "text-gray-500"],
          ] as [string, number, string][]
        ).map(([label, value, color]) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Liste */}
      {contracts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <div className="font-medium text-gray-500 mb-1">Aucun contrat pour l&apos;instant</div>
          <div className="text-sm text-gray-400 mb-6">
            Créez votre premier contrat conforme à la loi 2023-451
          </div>
          <Link
            href="/contrats/nouveau"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Créer un contrat
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-500">Marque</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Type</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Montant</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Statut</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Créé le</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr
                  key={contract.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{contract.organization.name}</div>
                    {contract.organization.siret && (
                      <div className="text-xs text-gray-400">SIRET {contract.organization.siret}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {COLLABORATION_LABELS[contract.type as CollaborationType]}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {contract.amount
                      ? `${Number(contract.amount).toLocaleString("fr-FR")} ${contract.currency}`
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        STATUS_COLORS[contract.status as ContractStatus]
                      }`}
                    >
                      {STATUS_LABELS[contract.status as ContractStatus]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(contract.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/contrats/${contract.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Voir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 px-6 py-4 border-t border-gray-100">
              {page > 1 && (
                <Link
                  href={`/contrats?page=${page - 1}`}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  ← Précédent
                </Link>
              )}
              <span className="text-sm text-gray-500">
                Page {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/contrats?page=${page + 1}`}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Suivant →
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info légale */}
      <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl p-4">
        <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-400" />
        <span>
          Tous les contrats intègrent automatiquement les clauses obligatoires de la loi n° 2023-451
          du 9 juin 2023 (art. 3, 5 et 7) et sont archivés avec empreinte SHA-256.
        </span>
      </div>
    </div>
  )
}
