// REQ-REG-001, REQ-REG-002, REQ-REG-003, REQ-REG-004, REQ-REG-005
// SPC-REG — Page Veille Réglementaire avec chatbot RAG, alertes et règles
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { listRegulatoryTexts } from "@/services/regulatory/knowledge-base"
import { getActiveAlerts } from "@/services/regulatory/alert-service"
import { listComplianceRules } from "@/services/regulatory/rules-engine"
import { VeilleTabs } from "@/components/regulatory/veille-tabs"
import { Bell } from "lucide-react"

export const metadata = { title: "Veille Réglementaire — InfluComply" }

export default async function VeillePage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) redirect("/login")

  const [texts, alerts, rules] = await Promise.all([
    listRegulatoryTexts(),
    getActiveAlerts(30),
    listComplianceRules(false), // toutes les règles (actives + inactives)
  ])

  const unreadAlerts = alerts.filter((a) => !a.readAt)
  const criticalAlerts = unreadAlerts.filter(
    (a) => a.severity === "CRITICAL" || a.severity === "HIGH"
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Veille Réglementaire</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Base de connaissances juridique · Chatbot RAG · Alertes JORF/DGCCRF/ARPP
          </p>
        </div>
        {unreadAlerts.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
            <Bell className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">
              {unreadAlerts.length} alerte{unreadAlerts.length > 1 ? "s" : ""} non lue
              {unreadAlerts.length > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Bannière alertes critiques */}
      {criticalAlerts.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="font-semibold text-red-800 mb-1">
            {criticalAlerts.length} alerte{criticalAlerts.length > 1 ? "s" : ""} critique
            {criticalAlerts.length > 1 ? "s" : ""} nécessite
            {criticalAlerts.length > 1 ? "nt" : ""} votre attention
          </div>
          <ul className="text-sm text-red-700 space-y-0.5">
            {criticalAlerts.slice(0, 3).map((a) => (
              <li key={a.id}>• {a.title}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-4 gap-4">
        {(
          [
            ["Textes indexés", texts.length, "text-zinc-900"],
            [
              "Alertes actives",
              unreadAlerts.length,
              unreadAlerts.length > 0 ? "text-amber-600" : "text-zinc-900",
            ],
            ["Règles actives", rules.filter((r) => r.isActive).length, "text-green-600"],
            ["Règles totales", rules.length, "text-zinc-500"],
          ] as [string, number, string][]
        ).map(([label, value, color]) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Onglets principaux */}
      <VeilleTabs texts={texts} alerts={alerts} rules={rules} />
    </div>
  )
}
