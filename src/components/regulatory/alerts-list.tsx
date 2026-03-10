"use client"
// REQ-REG-002 | Liste des alertes réglementaires avec marquage lu

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { RegulatoryAlertData } from "@/types/regulatory"
import {
  ALERT_SEVERITY_LABELS,
  ALERT_SEVERITY_COLORS,
  type AlertSeverity,
} from "@/types/regulatory"
import { Bell, BellOff, AlertTriangle, ExternalLink, CheckCircle } from "lucide-react"

interface AlertsListProps {
  alerts: RegulatoryAlertData[]
}

export function AlertsList({ alerts }: AlertsListProps) {
  const router = useRouter()
  const [readIds, setReadIds] = useState<Set<string>>(
    new Set(alerts.filter((a) => a.readAt).map((a) => a.id))
  )
  const [loading, setLoading] = useState<string | null>(null)

  async function markRead(id: string) {
    setLoading(id)
    try {
      await fetch("/api/regulatory/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", alertId: id }),
      })
      setReadIds((prev) => new Set([...prev, id]))
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  const unread = alerts.filter((a) => !readIds.has(a.id))
  const read = alerts.filter((a) => readIds.has(a.id))

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <BellOff className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <div className="font-medium text-gray-500">Aucune alerte réglementaire</div>
        <div className="text-sm text-gray-400 mt-1">
          Nous surveillons le JORF, la DGCCRF et l&apos;ARPP pour vous tenir informé.
        </div>
      </div>
    )
  }

  const renderAlert = (alert: RegulatoryAlertData) => {
    const isRead = readIds.has(alert.id)
    const colorCls = ALERT_SEVERITY_COLORS[alert.severity as AlertSeverity]
    const isOverdue =
      alert.actionDeadline && new Date(alert.actionDeadline) < new Date() && !isRead

    return (
      <div
        key={alert.id}
        className={`border rounded-xl p-4 transition-all ${
          isRead ? "opacity-60 bg-gray-50 border-gray-200" : `${colorCls} border`
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isRead ? "bg-gray-200" : "bg-white bg-opacity-60"
              }`}
            >
              {alert.actionRequired ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white bg-opacity-60`}>
                  {ALERT_SEVERITY_LABELS[alert.severity as AlertSeverity]}
                </span>
                <span className="text-xs opacity-70">{alert.source}</span>
                {alert.actionRequired && !isRead && (
                  <span className="text-xs font-medium bg-white bg-opacity-60 px-2 py-0.5 rounded-full">
                    Action requise
                  </span>
                )}
                {isOverdue && (
                  <span className="text-xs font-medium bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                    Délai dépassé
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-sm mb-1">{alert.title}</h3>
              <p className="text-sm opacity-80 leading-relaxed">{alert.summary}</p>

              <div className="flex items-center gap-3 mt-2 text-xs opacity-70">
                <span>
                  Publié le{" "}
                  {new Date(alert.publishedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                {alert.actionDeadline && (
                  <span className="font-medium">
                    Échéance :{" "}
                    {new Date(alert.actionDeadline).toLocaleDateString("fr-FR")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {!isRead && (
              <button
                onClick={() => markRead(alert.id)}
                disabled={loading === alert.id}
                title="Marquer comme lu"
                className="p-1.5 rounded-lg hover:bg-white hover:bg-opacity-50 transition-colors disabled:opacity-40"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {unread.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {unread.length} alerte{unread.length > 1 ? "s" : ""} non lue{unread.length > 1 ? "s" : ""}
            </span>
          </div>
          {unread.map(renderAlert)}
        </div>
      )}

      {read.length > 0 && (
        <div className="space-y-3">
          {unread.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <CheckCircle className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">Alertes lues</span>
            </div>
          )}
          {read.map(renderAlert)}
        </div>
      )}
    </div>
  )
}
