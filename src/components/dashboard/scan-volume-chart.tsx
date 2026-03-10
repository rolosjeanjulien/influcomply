"use client"

// Histogramme du volume de scans par jour
// SPC-DSH-006 — barres
// REQ-DSH-006

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { ScanVolumePoint } from "@/services/dashboard/dashboard-service"

interface ScanVolumeChartProps {
  data: ScanVolumePoint[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  })
}

interface TooltipPayload {
  value: number
  name: string
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
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm text-sm">
      <p className="text-zinc-500 mb-1">{label ? formatDate(label) : ""}</p>
      <p className="font-semibold text-blue-600">
        {payload[0].value} scan{payload[0].value > 1 ? "s" : ""}
      </p>
    </div>
  )
}

export function ScanVolumeChart({ data }: ScanVolumeChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-zinc-400 text-sm">
        Pas encore de scans ce mois-ci
      </div>
    )
  }

  const tickInterval = data.length > 15 ? Math.floor(data.length / 8) : 1

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          interval={tickInterval}
          tick={{ fontSize: 10, fill: "#a1a1aa" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fill: "#a1a1aa" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f4f4f5" }} />
        <Bar dataKey="scans" fill="#2563eb" radius={[3, 3, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  )
}
