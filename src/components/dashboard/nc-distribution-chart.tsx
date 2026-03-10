"use client"

// Camembert de distribution des non-conformités par type
// SPC-DSH-006
// REQ-DSH-006

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import type { NonConformityDistribution } from "@/services/dashboard/dashboard-service"

interface NcDistributionChartProps {
  data: NonConformityDistribution[]
}

interface TooltipPayload {
  name: string
  value: number
  payload: NonConformityDistribution
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayload[]
}) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm text-sm">
      <p className="font-medium text-zinc-800">{item.label}</p>
      <p className="text-zinc-500">
        {item.count} violation{item.count > 1 ? "s" : ""}
      </p>
    </div>
  )
}

function CustomLegend({
  payload,
}: {
  payload?: Array<{ value: string; color: string }>
}) {
  if (!payload) return null
  return (
    <ul className="flex flex-col gap-1.5 mt-2">
      {payload.map((entry, i) => (
        <li key={i} className="flex items-center gap-2 text-xs text-zinc-600">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: entry.color }}
          />
          {entry.value}
        </li>
      ))}
    </ul>
  )
}

export function NcDistributionChart({ data }: NcDistributionChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-400 text-sm">
        Aucune non-conformité active
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          cx="45%"
          cy="50%"
          outerRadius={70}
          innerRadius={36}
          paddingAngle={2}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          content={<CustomLegend />}
          layout="vertical"
          align="right"
          verticalAlign="middle"
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
