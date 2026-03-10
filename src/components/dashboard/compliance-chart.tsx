"use client"

// Graphique tendance du score de conformité sur 90 jours
// SPC-DSH-006 — graphique linéaire
// REQ-DSH-006

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts"
import type { ScoreTrendPoint } from "@/services/dashboard/dashboard-service"

interface ComplianceChartProps {
  data: ScoreTrendPoint[]
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

interface TooltipPayload {
  value: number
  payload: ScoreTrendPoint
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const score = payload[0].value
  const color =
    score >= 80 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626"

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm text-sm">
      <p className="text-zinc-500 mb-1">{label ? formatDate(label) : ""}</p>
      <p className="font-semibold" style={{ color }}>
        Score : {score}/100
      </p>
      {payload[0].payload.scanCount > 0 && (
        <p className="text-zinc-400 text-xs">
          {payload[0].payload.scanCount} scan
          {payload[0].payload.scanCount > 1 ? "s" : ""}
        </p>
      )}
    </div>
  )
}

export function ComplianceChart({ data }: ComplianceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-400 text-sm">
        Pas encore de données — lancez votre premier scan
      </div>
    )
  }

  // Sous-échantillonner les labels si trop de points
  const tickInterval = data.length > 30 ? Math.floor(data.length / 10) : 1

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          interval={tickInterval}
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          axisLine={false}
          tickLine={false}
        />
        {/* Seuils de certification */}
        <ReferenceLine
          y={80}
          stroke="#16a34a"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          label={{ value: "Certifié", position: "right", fontSize: 10, fill: "#16a34a" }}
        />
        <ReferenceLine
          y={50}
          stroke="#d97706"
          strokeDasharray="4 4"
          strokeWidth={1}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#2563eb"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#2563eb" }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
