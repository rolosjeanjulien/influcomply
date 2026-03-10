// REQ-CRT-003 | Annuaire public des créateurs certifiés — sans authentification
import { getCertifiedCreators } from "@/services/certification/badge-engine"
import { ScoreBadge } from "@/components/scanner/score-badge"
import Link from "next/link"
import { ShieldCheck, Search } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Annuaire des créateurs certifiés — InfluComply",
  description:
    "Découvrez les créateurs de contenu certifiés conformes à la loi n° 2023-451 du 9 juin 2023 sur l'influence commerciale.",
  openGraph: {
    title: "Annuaire InfluComply Certified",
    description: "Créateurs certifiés conformes à la loi influence commerciale 2023",
    type: "website",
  },
}

const PLATFORM_LABELS: Record<string, string> = {
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
}

export const revalidate = 300 // CDN cache 5 min

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page ?? "1")
  const { creators, total, limit } = await getCertifiedCreators(page, 24)
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                InfluComply
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Annuaire des créateurs certifiés
              </h1>
            </div>
          </div>
          <p className="text-gray-500 max-w-2xl">
            Ces créateurs ont maintenu un score de conformité ≥ 80/100 sur 90 jours consécutifs,
            attestant de leur respect de la loi n° 2023-451 du 9 juin 2023 sur l&apos;influence
            commerciale.
          </p>
          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span>
                <strong className="text-gray-900">{total}</strong> créateur
                {total > 1 ? "s" : ""} certifié{total > 1 ? "s" : ""}
              </span>
            </div>
            <div className="text-sm text-gray-400">·</div>
            <div className="text-sm text-gray-500">Mis à jour le 1er de chaque mois</div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {creators.length === 0 ? (
          <div className="text-center py-20">
            <ShieldCheck className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-400 mb-2">
              Aucun créateur certifié pour l&apos;instant
            </h2>
            <p className="text-gray-400 text-sm">
              Les certifications sont calculées mensuellement.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(creators as Array<{ id: string; name: string | null; slug: string | null; badge: { status: string; certifiedSince: Date | null } | null; complianceScores: Array<{ score: number }>; socialAccounts: Array<{ platform: string }> }>).map((creator) => {
                const latestScore = creator.complianceScores[0]?.score ?? null
                const platforms = creator.socialAccounts.map((a) => a.platform)
                const certifiedSince = creator.badge?.certifiedSince

                return (
                  <Link
                    key={creator.id}
                    href={`/createur/${creator.slug}`}
                    className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-green-300 hover:shadow-md transition-all group"
                  >
                    {/* Avatar placeholder */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {(creator.name ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate group-hover:text-green-700 transition-colors">
                          {creator.name ?? creator.slug}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <ShieldCheck className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span className="text-xs text-green-600 font-medium">Certifié</span>
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    {latestScore !== null && (
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500">Score conformité</span>
                        <ScoreBadge score={latestScore} size="sm" />
                      </div>
                    )}

                    {/* Plateformes */}
                    {platforms.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-3">
                        {platforms.map((p) => (
                          <span
                            key={p}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                          >
                            {PLATFORM_LABELS[p] ?? p}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Date */}
                    {certifiedSince && (
                      <div className="text-xs text-gray-400">
                        Certifié depuis{" "}
                        {new Date(certifiedSince).toLocaleDateString("fr-FR", {
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-10">
                {page > 1 && (
                  <Link
                    href={`/directory?page=${page - 1}`}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                  >
                    ← Précédent
                  </Link>
                )}
                <span className="text-sm text-gray-500">
                  Page {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/directory?page=${page + 1}`}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                  >
                    Suivant →
                  </Link>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer légal */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>
            La certification InfluComply est calculée automatiquement sur la base des scores de
            conformité à la loi n° 2023-451 du 9 juin 2023. Elle ne constitue pas un avis juridique.
          </p>
          <p className="mt-1">
            Pour vérifier le statut d&apos;un créateur via API :{" "}
            <code className="bg-gray-100 px-1 rounded">
              GET /api/public/verify/[slug]
            </code>
          </p>
        </div>
      </div>
    </div>
  )
}
