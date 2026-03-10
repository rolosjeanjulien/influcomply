// REQ-CRT-001, REQ-CRT-002, REQ-CRT-003, REQ-CRT-004 | Page Certification & Badge
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { getUserBadge, evaluateCreatorBadge } from "@/services/certification/badge-engine"
import { BadgeCard } from "@/components/certification/badge-card"
import { getScoreTrend } from "@/services/dashboard/dashboard-service"
import { BADGE_RULES } from "@/types/certification"
import type { BadgeStatus } from "@/types/certification"
import Link from "next/link"
import { ExternalLink, Code } from "lucide-react"

export const metadata = { title: "Certification — InfluComply" }

export default async function CertificationPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) redirect("/login")

  // Évaluation automatique au chargement si pas encore évalué
  let badge = await getUserBadge(dbUser.id)
  if (!badge || !badge.lastCheckedAt) {
    await evaluateCreatorBadge(dbUser.id)
    badge = await getUserBadge(dbUser.id)
  }

  // Score moyen 90 jours pour la progression
  const trend = await getScoreTrend(dbUser.id, BADGE_RULES.CERTIFICATION_DAYS)
  const score90d =
    trend.length > 0
      ? Math.round(trend.reduce((s: number, p: { score: number }) => s + p.score, 0) / trend.length)
      : null

  const badgeTyped = badge
    ? {
        status: badge.status as BadgeStatus,
        certifiedSince: badge.certifiedSince,
        revokedAt: badge.revokedAt,
        lastCheckedAt: badge.lastCheckedAt,
        history: badge.history.map((h: { id: string; status: string; reason: string | null; score: number | null; changedAt: Date }) => ({
          id: h.id,
          status: h.status as BadgeStatus,
          reason: h.reason,
          score: h.score,
          changedAt: h.changedAt,
        })),
      }
    : null

  const isCertified = badge?.status === "CERTIFIED"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Certification & Badge</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Badge InfluComply Certified — score ≥ {BADGE_RULES.CERTIFICATION_SCORE}/100 sur{" "}
          {BADGE_RULES.CERTIFICATION_DAYS} jours consécutifs
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="col-span-2 space-y-6">
          {/* Explications */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Comment fonctionne la certification ?</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-blue-600 text-sm">
                  1
                </div>
                <div>
                  <div className="font-medium text-gray-900">Scannez régulièrement vos contenus</div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    Minimum {BADGE_RULES.MIN_SCANS} scans sur {BADGE_RULES.CERTIFICATION_DAYS} jours.
                    Chaque publication analysée alimente votre score de conformité.
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-blue-600 text-sm">
                  2
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    Maintenez un score ≥ {BADGE_RULES.CERTIFICATION_SCORE}/100
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    Votre score moyen sur les 90 derniers jours doit rester au-dessus du seuil de
                    certification. Corrigez les non-conformités dès qu&apos;elles apparaissent.
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-green-600 text-sm">
                  3
                </div>
                <div>
                  <div className="font-medium text-gray-900">Le badge est attribué automatiquement</div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    L&apos;évaluation est recalculée le 1er de chaque mois et à chaque nouveau scan.
                    Partagez votre badge SVG sur vos profils et médias.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Intégration du badge */}
          {isCertified && dbUser.slug && (
            <div className="bg-white rounded-2xl border border-green-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Intégrer votre badge</h2>

              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Badge SVG (site web, blog, signature email)
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-600 overflow-x-auto">
                    {`<img src="https://influcomply.fr/api/public/badge/${dbUser.slug}" alt="InfluComply Certified" />`}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Lien de vérification (annonceurs)
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-600 overflow-x-auto">
                    {`https://influcomply.fr/api/public/verify/${dbUser.slug}`}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <Link
                  href={`/createur/${dbUser.slug}`}
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Voir mon profil public
                </Link>
                <Link
                  href="/directory"
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Code className="h-4 w-4" />
                  Annuaire certifiés
                </Link>
              </div>
            </div>
          )}

          {/* Info révocation */}
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 text-sm text-amber-800">
            <div className="font-semibold mb-1">Règle de révocation automatique</div>
            <p>
              Si votre score moyen descend en dessous de{" "}
              <strong>{BADGE_RULES.REVOCATION_SCORE}/100</strong> sur une période de{" "}
              <strong>{BADGE_RULES.REVOCATION_DAYS} jours</strong>, le badge sera automatiquement
              révoqué (REQ-CRT-004). Vous pourrez le récupérer dès que votre score revient au-dessus
              de {BADGE_RULES.CERTIFICATION_SCORE}/100 sur 90 jours.
            </p>
          </div>
        </div>

        {/* Colonne latérale — Badge card */}
        <div>
          <BadgeCard
            badge={badgeTyped}
            userId={dbUser.id}
            userSlug={dbUser.slug}
            score90d={score90d}
          />
        </div>
      </div>
    </div>
  )
}
