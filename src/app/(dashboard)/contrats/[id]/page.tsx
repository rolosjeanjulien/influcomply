// REQ-CTR-002, REQ-CTR-008, REQ-CTR-009 | SPC-CTR-001, SPC-CTR-004 — Détail contrat
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { getContractById } from "@/services/contracts/contract-service"
import { generateContractContent } from "@/services/contracts/template-service"
import { STATUS_LABELS, COLLABORATION_LABELS } from "@/types/contract"
import type { CollaborationType, ContractStatus } from "@/types/contract"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, FileText, Shield, Hash } from "lucide-react"
import { ContractActions } from "@/components/contracts/contract-actions"

const STATUS_COLORS: Record<ContractStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PENDING_SIGNATURE: "bg-amber-100 text-amber-700",
  SIGNED: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  EXPIRED: "bg-red-100 text-red-600",
  TERMINATED: "bg-red-100 text-red-600",
}

export default async function ContratDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) redirect("/login")

  const { id } = await params
  const contract = await getContractById(id, dbUser.id)
  if (!contract) notFound()

  // Re-générer le contenu pour affichage (non stocké en DB pour économiser l'espace)
  const contractContent = generateContractContent({
    type: contract.type as CollaborationType,
    creatorName: dbUser.name ?? "Créateur",
    creatorEmail: dbUser.email,
    brandName: contract.organization.name,
    brandEmail: "",
    brandSiret: contract.organization.siret ?? undefined,
    amount: contract.amount ? Number(contract.amount) : undefined,
    currency: contract.currency,
    startDate: contract.startDate ?? undefined,
    endDate: contract.endDate ?? undefined,
    hasIpClause: true,
    hasJointLiabilityClause: true,
    hasExclusivityClause: false,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/contrats"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux contrats
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{contract.organization.name}</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {COLLABORATION_LABELS[contract.type as CollaborationType]} —{" "}
              {new Date(contract.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <span
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              STATUS_COLORS[contract.status as ContractStatus]
            }`}
          >
            {STATUS_LABELS[contract.status as ContractStatus]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Colonne principale — contenu contrat */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Contenu du contrat</h2>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed bg-gray-50 rounded-xl p-4 max-h-[600px] overflow-y-auto">
              {contractContent}
            </pre>
          </div>
        </div>

        {/* Colonne latérale — métadonnées + actions */}
        <div className="space-y-4">
          {/* Infos */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Informations</h3>
            <div className="space-y-3 text-sm">
              {contract.amount && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Montant</span>
                  <span className="font-medium">
                    {Number(contract.amount).toLocaleString("fr-FR")} {contract.currency}
                  </span>
                </div>
              )}
              {contract.startDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Début</span>
                  <span className="font-medium">
                    {new Date(contract.startDate).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              )}
              {contract.endDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Fin</span>
                  <span className="font-medium">
                    {new Date(contract.endDate).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              )}
              {contract.signedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Signé le</span>
                  <span className="font-medium text-green-600">
                    {new Date(contract.signedAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <ContractActions
            contractId={contract.id}
            status={contract.status as ContractStatus}
          />

          {/* Intégrité */}
          {contract.fileHash && (
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Hash className="h-4 w-4 text-gray-400" />
                <h3 className="font-medium text-gray-700 text-sm">Intégrité du document</h3>
              </div>
              <div className="text-xs font-mono text-gray-400 break-all">
                SHA-256: {contract.fileHash}
              </div>
            </div>
          )}

          {/* Conformité légale */}
          <div className="bg-green-50 rounded-2xl border border-green-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-green-600" />
              <h3 className="font-medium text-green-800 text-sm">Conformité légale</h3>
            </div>
            <ul className="text-xs text-green-700 space-y-1">
              <li>✓ Clause de responsabilité solidaire (art. 7)</li>
              <li>✓ Mention publicitaire obligatoire (art. 5)</li>
              <li>✓ Produits interdits identifiés (art. 3)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
