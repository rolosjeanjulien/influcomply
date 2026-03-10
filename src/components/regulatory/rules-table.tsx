"use client"
// REQ-REG-005 | Tableau des règles de conformité avec toggle actif/inactif

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { ComplianceRuleData } from "@/types/regulatory"
import { Shield, ToggleLeft, ToggleRight, Code, Brain, Layers } from "lucide-react"

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-blue-100 text-blue-700",
}

const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: "Critique",
  HIGH: "Élevé",
  MEDIUM: "Moyen",
  LOW: "Faible",
}

const PATTERN_ICONS: Record<string, React.ReactNode> = {
  REGEX: <Code className="h-3 w-3" />,
  SEMANTIC: <Brain className="h-3 w-3" />,
  HYBRID: <Layers className="h-3 w-3" />,
}

interface RulesTableProps {
  rules: ComplianceRuleData[]
}

export function RulesTable({ rules }: RulesTableProps) {
  const router = useRouter()
  const [toggling, setToggling] = useState<string | null>(null)
  const [localStates, setLocalStates] = useState<Record<string, boolean>>(
    Object.fromEntries(rules.map((r) => [r.code, r.isActive]))
  )

  async function toggle(code: string) {
    setToggling(code)
    const newState = !localStates[code]
    try {
      const res = await fetch("/api/regulatory/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", code, isActive: newState }),
      })
      if (res.ok) {
        setLocalStates((prev) => ({ ...prev, [code]: newState }))
        router.refresh()
      }
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Shield className="h-5 w-5 text-blue-600" />
        <h2 className="font-semibold text-gray-900">Règles de conformité</h2>
        <span className="ml-auto text-sm text-gray-400">
          {rules.filter((r) => localStates[r.code]).length}/{rules.length} actives
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 font-medium text-gray-500 w-24">Code</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Règle</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 w-24">Sévérité</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 w-24">Type</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Référence légale</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 w-20">Version</th>
              <th className="px-5 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => {
              const active = localStates[rule.code]
              return (
                <tr
                  key={rule.code}
                  className={`border-b border-gray-100 last:border-0 transition-colors ${
                    active ? "hover:bg-gray-50" : "opacity-50 bg-gray-50"
                  }`}
                >
                  <td className="px-5 py-4">
                    <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                      {rule.code}
                    </code>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">{rule.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5 max-w-sm">{rule.description}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        SEVERITY_COLORS[rule.severity] ?? ""
                      }`}
                    >
                      {SEVERITY_LABELS[rule.severity] ?? rule.severity}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      {PATTERN_ICONS[rule.patternType]}
                      <span>{rule.patternType}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    {rule.legalRef ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-400 text-center">
                    v{rule.version}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggle(rule.code)}
                      disabled={toggling === rule.code}
                      title={active ? "Désactiver" : "Activer"}
                      className="text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-40"
                    >
                      {active ? (
                        <ToggleRight className="h-6 w-6 text-blue-600" />
                      ) : (
                        <ToggleLeft className="h-6 w-6" />
                      )}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
