"use client"

// Bouton de génération du rapport d'audit — REQ-DSH-003, SPC-DSH-003

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Loader2 } from "lucide-react"

export function AuditReportButton() {
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      const periodEnd = new Date()
      const periodStart = new Date()
      periodStart.setDate(periodStart.getDate() - 30)

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodStart, periodEnd }),
      })

      if (!res.ok) return

      // Téléchargement automatique
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `rapport-audit-influcomply-${new Date().toISOString().split("T")[0]}.html`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleGenerate} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileText className="h-4 w-4 mr-2" />
      )}
      Rapport d'audit
    </Button>
  )
}
