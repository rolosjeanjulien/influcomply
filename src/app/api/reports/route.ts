// POST /api/reports — Génération du rapport d'audit PDF
// REQ-DSH-003, SPC-DSH-003

import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const reportSchema = z.object({
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
    })
    if (!user)
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })

    const body = await request.json()
    const { periodStart, periodEnd } = reportSchema.parse(body)

    // Collecter les données de la période
    const [scans, nonConformities, scores] = await Promise.all([
      prisma.scanResult.findMany({
        where: {
          publication: { userId: user.id },
          scannedAt: { gte: periodStart, lte: periodEnd },
          status: "COMPLETED",
        },
        include: {
          publication: true,
          nonConformities: true,
        },
        orderBy: { scannedAt: "desc" },
      }),
      prisma.nonConformity.findMany({
        where: {
          scanResult: {
            publication: { userId: user.id },
            scannedAt: { gte: periodStart, lte: periodEnd },
          },
        },
      }),
      prisma.complianceScore.findMany({
        where: {
          userId: user.id,
          date: { gte: periodStart, lte: periodEnd },
        },
        orderBy: { date: "asc" },
      }),
    ])

    const avgScore =
      scores.length > 0
        ? Math.round(
            scores.reduce((sum, s) => sum + s.score, 0) / scores.length
          )
        : null

    const resolvedCount = nonConformities.filter((nc) => nc.isResolved).length
    const unresolvedCount = nonConformities.length - resolvedCount

    // Générer le HTML du rapport
    const html = generateReportHTML({
      user,
      periodStart,
      periodEnd,
      scans,
      nonConformities,
      scores,
      avgScore,
      resolvedCount,
      unresolvedCount,
    })

    // Enregistrer le rapport en base
    await prisma.auditReport.create({
      data: {
        userId: user.id,
        periodStart,
        periodEnd,
      },
    })

    // Retourner le HTML (Puppeteer sera intégré côté Trigger.dev)
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="rapport-audit-influcomply-${periodStart.toISOString().split("T")[0]}.html"`,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Paramètres invalides", details: error.flatten() },
        { status: 400 }
      )
    }
    console.error("[POST /api/reports]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

function generateReportHTML(data: {
  user: { name: string | null; email: string }
  periodStart: Date
  periodEnd: Date
  scans: Array<{
    id: string
    score: number
    scannedAt: Date
    publication: { platform: string; url: string | null; content: string | null }
    nonConformities: Array<{ type: string; severity: string; isResolved: boolean }>
  }>
  nonConformities: Array<{ type: string; severity: string; isResolved: boolean }>
  scores: Array<{ date: Date; score: number }>
  avgScore: number | null
  resolvedCount: number
  unresolvedCount: number
}) {
  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

  const severityLabel: Record<string, string> = {
    CRITICAL: "Critique",
    HIGH: "Élevée",
    MEDIUM: "Moyenne",
    LOW: "Faible",
  }
  const typeLabel: Record<string, string> = {
    MISSING_AD_MENTION: "Mention pub. manquante",
    PROHIBITED_PRODUCT: "Produit interdit",
    RETOUCHED_IMAGE: "Image retouchée",
    OTHER: "Autre",
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Rapport d'audit InfluComply</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #18181b; padding: 40px; max-width: 860px; margin: 0 auto; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    h2 { font-size: 16px; font-weight: 600; color: #3f3f46; margin-top: 32px; border-bottom: 1px solid #e4e4e7; padding-bottom: 8px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .brand { color: #2563eb; font-weight: 700; font-size: 18px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
    .kpi { background: #f4f4f5; border-radius: 8px; padding: 16px; }
    .kpi-label { font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi-value { font-size: 28px; font-weight: 700; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px; }
    th { background: #f4f4f5; padding: 8px 12px; text-align: left; font-weight: 600; }
    td { padding: 8px 12px; border-bottom: 1px solid #f4f4f5; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
    .badge-ok { background: #dcfce7; color: #166534; }
    .badge-warn { background: #fef9c3; color: #854d0e; }
    .badge-err { background: #fee2e2; color: #991b1b; }
    .disclaimer { margin-top: 40px; padding: 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; font-size: 12px; color: #1d4ed8; }
    .footer { margin-top: 32px; font-size: 11px; color: #a1a1aa; text-align: center; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">InfluComply</div>
      <h1>Rapport d'audit de conformité</h1>
      <p style="color:#71717a;font-size:14px;margin:4px 0 0">
        ${data.user.name ?? data.user.email} &nbsp;·&nbsp;
        Période du ${fmt(data.periodStart)} au ${fmt(data.periodEnd)}
      </p>
    </div>
    <div style="text-align:right;font-size:12px;color:#71717a;">
      Généré le ${fmt(new Date())}<br/>
      Loi n° 2023-451 du 9 juin 2023
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-label">Score moyen</div>
      <div class="kpi-value" style="color:${data.avgScore && data.avgScore >= 80 ? '#16a34a' : data.avgScore && data.avgScore >= 50 ? '#d97706' : '#dc2626'}">${data.avgScore ?? '—'}<span style="font-size:14px;color:#71717a">/100</span></div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Publications scannées</div>
      <div class="kpi-value">${data.scans.length}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Non-conformités</div>
      <div class="kpi-value" style="color:${data.unresolvedCount > 0 ? '#dc2626' : '#18181b'}">${data.unresolvedCount}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Corrigées</div>
      <div class="kpi-value" style="color:#16a34a">${data.resolvedCount}</div>
    </div>
  </div>

  <h2>Publications analysées</h2>
  ${data.scans.length === 0 ? '<p style="color:#71717a;font-size:13px">Aucune publication scannée sur cette période.</p>' : `
  <table>
    <thead><tr><th>Plateforme</th><th>Publication</th><th>Date</th><th>Score</th><th>Alertes</th></tr></thead>
    <tbody>
    ${data.scans.map((s) => `
      <tr>
        <td>${s.publication.platform}</td>
        <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.publication.url ?? s.publication.content?.slice(0, 60) ?? '—'}${(s.publication.content?.length ?? 0) > 60 ? '…' : ''}</td>
        <td>${s.scannedAt.toLocaleDateString('fr-FR')}</td>
        <td><span class="badge ${s.score >= 80 ? 'badge-ok' : s.score >= 50 ? 'badge-warn' : 'badge-err'}">${s.score}/100</span></td>
        <td>${s.nonConformities.filter((nc) => !nc.isResolved).length > 0 ? `<span class="badge badge-err">${s.nonConformities.filter((nc) => !nc.isResolved).length} active${s.nonConformities.filter((nc) => !nc.isResolved).length > 1 ? 's' : ''}</span>` : '<span class="badge badge-ok">Conforme</span>'}</td>
      </tr>`).join('')}
    </tbody>
  </table>`}

  <h2>Non-conformités détectées</h2>
  ${data.nonConformities.length === 0 ? '<p style="color:#16a34a;font-size:13px">✓ Aucune non-conformité détectée sur la période.</p>' : `
  <table>
    <thead><tr><th>Type</th><th>Gravité</th><th>Statut</th></tr></thead>
    <tbody>
    ${data.nonConformities.map((nc) => `
      <tr>
        <td>${typeLabel[nc.type] ?? nc.type}</td>
        <td>${severityLabel[nc.severity] ?? nc.severity}</td>
        <td><span class="badge ${nc.isResolved ? 'badge-ok' : 'badge-err'}">${nc.isResolved ? 'Résolue' : 'Active'}</span></td>
      </tr>`).join('')}
    </tbody>
  </table>`}

  <div class="disclaimer">
    <strong>Avertissement légal :</strong> Ce rapport est fourni à titre informatif et documentaire.
    Il ne constitue pas un avis juridique. InfluComply recommande de consulter un juriste spécialisé
    en droit de la communication commerciale pour toute question relative à la conformité réglementaire.
    Conforme à la loi n° 2023-451 du 9 juin 2023 et ses décrets d'application.
  </div>

  <div class="footer">
    InfluComply · Rapport généré automatiquement · ${new Date().toISOString()}
  </div>
</body>
</html>`
}
