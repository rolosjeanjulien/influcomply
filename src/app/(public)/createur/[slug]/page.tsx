// Profil public d'un créateur certifié
// REQ-DSH-004, SPC-DSH-004 — accessible sans authentification
// REQ-CRT-003 — intégration annuaire

import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getScoreTrend } from "@/services/dashboard/dashboard-service"
import { ScoreBadge } from "@/components/scanner/score-badge"
import { ComplianceChart } from "@/components/dashboard/compliance-chart"
import {
  ShieldCheck,
  BadgeCheck,
  Calendar,
  ExternalLink,
} from "lucide-react"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const user = await prisma.user.findUnique({
    where: { slug, isPublic: true },
    select: { name: true },
  })
  if (!user) return { title: "Créateur introuvable" }
  return {
    title: `${user.name ?? slug} — Profil de conformité`,
    description: `Vérifiez la conformité réglementaire de ${user.name ?? slug} sur InfluComply (loi 2023-451).`,
  }
}

export default async function CreateurPublicPage({ params }: Props) {
  const { slug } = await params

  const user = await prisma.user.findUnique({
    where: { slug, isPublic: true },
    include: {
      badge: true,
      complianceScores: {
        orderBy: { date: "desc" },
        take: 1,
      },
      socialAccounts: {
        where: { isActive: true },
        select: { platform: true, username: true, followerCount: true },
      },
    },
  })

  if (!user) notFound()

  const [scoreTrend, unresolvedNC] = await Promise.all([
    getScoreTrend(user.id, 90),
    prisma.nonConformity.count({
      where: {
        isResolved: false,
        scanResult: { publication: { userId: user.id } },
      },
    }),
  ])

  const currentScore = user.complianceScores[0]?.score ?? null
  const badge = user.badge

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* En-tête profil */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-zinc-900">
                {user.name ?? slug}
              </h1>
              {user.socialAccounts.length > 0 && (
                <p className="text-sm text-zinc-500 mt-1">
                  {user.socialAccounts
                    .map((a) => `@${a.username} (${a.platform})`)
                    .join(" · ")}
                </p>
              )}
            </div>
            {currentScore !== null && (
              <ScoreBadge score={currentScore} size="md" showLabel />
            )}
          </div>

          {/* Badge certification */}
          {badge?.status === "CERTIFIED" && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
              <BadgeCheck className="h-5 w-5 text-blue-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">
                  Certifié InfluComply
                </p>
                {badge.certifiedSince && (
                  <p className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3" />
                    Depuis le{" "}
                    {new Date(badge.certifiedSince).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Indicateur NC */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-zinc-50 px-4 py-3">
              <p className="text-xs text-zinc-500 mb-1">Score de conformité</p>
              <p
                className={`text-2xl font-bold ${
                  currentScore === null
                    ? "text-zinc-400"
                    : currentScore >= 80
                    ? "text-green-600"
                    : currentScore >= 50
                    ? "text-orange-500"
                    : "text-red-500"
                }`}
              >
                {currentScore ?? "—"}
                {currentScore !== null && (
                  <span className="text-sm font-normal text-zinc-400">/100</span>
                )}
              </p>
            </div>
            <div className="rounded-lg bg-zinc-50 px-4 py-3">
              <p className="text-xs text-zinc-500 mb-1">Non-conformités actives</p>
              <p
                className={`text-2xl font-bold ${
                  unresolvedNC > 0 ? "text-red-500" : "text-green-600"
                }`}
              >
                {unresolvedNC}
              </p>
            </div>
          </div>
        </div>

        {/* Graphique tendance */}
        {scoreTrend.length > 0 && (
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-zinc-700 mb-4">
              Historique du score — 90 derniers jours
            </h2>
            <ComplianceChart data={scoreTrend} />
          </div>
        )}

        {/* Footer légal */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-medium">InfluComply</span>
          </div>
          <p className="text-xs text-zinc-400">
            Vérification de conformité selon la loi n° 2023-451 du 9 juin 2023
          </p>
          <a
            href={`/api/public/verify/${user.slug ?? slug}`}
            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600"
          >
            <ExternalLink className="h-3 w-3" />
            Vérifier via API
          </a>
        </div>
      </div>
    </div>
  )
}
