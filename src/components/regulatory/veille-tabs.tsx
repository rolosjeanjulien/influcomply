"use client"
// REQ-REG-001→005 | Onglets de navigation de la page Veille

import { useState } from "react"
import { RagChatbot } from "./rag-chatbot"
import { AlertsList } from "./alerts-list"
import { RulesTable } from "./rules-table"
import type { RegulatoryTextSummary, RegulatoryAlertData, ComplianceRuleData } from "@/types/regulatory"
import {
  REG_TEXT_TYPE_LABELS,
  REG_TEXT_TYPE_COLORS,
  type RegTextType,
} from "@/types/regulatory"
import { MessageSquare, Bell, Shield, BookOpen, ExternalLink } from "lucide-react"

interface VeilleTabsProps {
  texts: RegulatoryTextSummary[]
  alerts: RegulatoryAlertData[]
  rules: ComplianceRuleData[]
}

type Tab = "chat" | "alerts" | "texts" | "rules"

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "chat", label: "Assistant IA", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "alerts", label: "Alertes", icon: <Bell className="h-4 w-4" /> },
  { id: "texts", label: "Base juridique", icon: <BookOpen className="h-4 w-4" /> },
  { id: "rules", label: "Règles de conformité", icon: <Shield className="h-4 w-4" /> },
]

function TextsGrid({ texts }: { texts: RegulatoryTextSummary[] }) {
  if (texts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
        <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <div className="font-medium text-gray-500">Base de connaissances vide</div>
        <div className="text-sm text-gray-400 mt-1">
          Les textes réglementaires seront chargés lors du déploiement.
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {texts.map((text) => (
        <div
          key={text.id}
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-sm transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    REG_TEXT_TYPE_COLORS[text.type as RegTextType]
                  }`}
                >
                  {REG_TEXT_TYPE_LABELS[text.type as RegTextType]}
                </span>
                <span className="text-xs text-gray-400">{text.source}</span>
                <span className="text-xs text-gray-400">
                  {new Date(text.publishedAt).toLocaleDateString("fr-FR", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className="text-xs text-gray-400">
                  {text.chunkCount} section{text.chunkCount > 1 ? "s" : ""}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">{text.title}</h3>
            </div>
            {text.url && (
              <a
                href={text.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="Voir le texte original"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export function VeilleTabs({ texts, alerts, rules }: VeilleTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("chat")
  const unreadCount = alerts.filter((a) => !a.readAt).length

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === "alerts" && unreadCount > 0 && (
              <span className="w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
      {activeTab === "chat" && <RagChatbot />}
      {activeTab === "alerts" && <AlertsList alerts={alerts} />}
      {activeTab === "texts" && <TextsGrid texts={texts} />}
      {activeTab === "rules" && <RulesTable rules={rules} />}
    </div>
  )
}
