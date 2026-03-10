"use client"
// REQ-REG-003, REQ-REG-004 | Chatbot RAG réglementaire avec citation de sources

import { useState, useRef, useEffect } from "react"
import type { ChatMessage, RagSource } from "@/types/regulatory"
import { REG_TEXT_TYPE_LABELS } from "@/types/regulatory"
import { Send, Bot, User, ExternalLink, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"

function ConfidenceBadge({ confidence }: { confidence: "high" | "medium" | "low" }) {
  const config = {
    high: { label: "Haute confiance", cls: "bg-green-100 text-green-700" },
    medium: { label: "Confiance moyenne", cls: "bg-amber-100 text-amber-700" },
    low: { label: "Faible confiance", cls: "bg-red-100 text-red-700" },
  }
  const { label, cls } = config[confidence]
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>
  )
}

function SourceCard({ source }: { source: RagSource }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-blue-600 whitespace-nowrap">
            {REG_TEXT_TYPE_LABELS[source.type]}
          </span>
          <span className="text-xs text-gray-600 truncate">{source.title}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-gray-400">
            {Math.round(source.similarity * 100)}%
          </span>
          {open ? (
            <ChevronUp className="h-3 w-3 text-gray-400" />
          ) : (
            <ChevronDown className="h-3 w-3 text-gray-400" />
          )}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-600 mt-2 leading-relaxed italic">
            &quot;{source.excerpt}&quot;
          </p>
          {source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-3 w-3" />
              Voir le texte original
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isAssistant = msg.role === "assistant"

  return (
    <div className={`flex gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isAssistant ? "bg-blue-100" : "bg-gray-100"
        }`}
      >
        {isAssistant ? (
          <Bot className="h-4 w-4 text-blue-600" />
        ) : (
          <User className="h-4 w-4 text-gray-600" />
        )}
      </div>
      <div className={`flex-1 max-w-[85%] ${isAssistant ? "" : "flex flex-col items-end"}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isAssistant
              ? "bg-white border border-gray-200 text-gray-800"
              : "bg-blue-600 text-white"
          }`}
        >
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>

        {/* Sources (REQ-REG-004 — obligatoire) */}
        {isAssistant && msg.sources && msg.sources.length > 0 && (
          <div className="mt-2 w-full space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Sources :</span>
              {/* confidence est stocké dans un champ custom */}
            </div>
            {msg.sources.map((source, i) => (
              <SourceCard key={i} source={source} />
            ))}
          </div>
        )}

        <span className="text-xs text-gray-400 mt-1">
          {msg.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  )
}

const SUGGESTED_QUESTIONS = [
  "Quelles mentions obligatoires sur un post sponsorisé Instagram ?",
  "Un contrat est-il obligatoire pour un gifting de 50€ ?",
  "Peut-on promouvoir des compléments alimentaires minceur ?",
  "Quelle est la sanction pour absence de mention publicitaire ?",
]

export function RagChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Bonjour ! Je suis votre assistant juridique spécialisé dans la réglementation de l'influence commerciale en France.\n\n" +
        "Je peux répondre à vos questions sur la loi n° 2023-451, les recommandations ARPP, les positions DGCCRF et les obligations légales des créateurs de contenu.\n\n" +
        "Posez-moi une question !",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage(question: string) {
    if (!question.trim() || loading) return
    setShowSuggestions(false)

    const userMsg: ChatMessage = {
      role: "user",
      content: question.trim(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const history = messages
        .filter((m) => m.role !== "assistant" || messages.indexOf(m) > 0)
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch("/api/regulatory/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), history }),
      })

      if (!res.ok) throw new Error("Erreur de communication")
      const data = await res.json()

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-240px)] min-h-[500px] bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="font-semibold text-gray-900">Assistant Réglementaire</div>
          <div className="text-xs text-gray-500">Spécialisé loi 2023-451 · DGCCRF · ARPP</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-gray-500">En ligne</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot className="h-4 w-4 text-blue-600" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Questions suggérées */}
        {showSuggestions && messages.length === 1 && (
          <div>
            <p className="text-xs text-gray-400 mb-2">Questions fréquentes :</p>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg border border-blue-100 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Disclaimer */}
      <div className="px-5 py-2 bg-amber-50 border-t border-amber-100">
        <div className="flex items-start gap-1.5 text-xs text-amber-700">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>Cet assistant fournit une information juridique générale. Pour toute situation spécifique, consultez un avocat.</span>
        </div>
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage(input)
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez une question sur la réglementation..."
            disabled={loading}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
