"use client"

// REQ-SCN-002, REQ-SCN-003 — import manuel URL / texte
// SPC-SCN-003

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Link as LinkIcon, FileText, Instagram } from "lucide-react"
import { cn } from "@/lib/utils"

type Platform = "INSTAGRAM" | "TIKTOK" | "YOUTUBE"
type ImportMode = "url" | "text"

const PLATFORMS: { value: Platform; label: string; color: string }[] = [
  { value: "INSTAGRAM", label: "Instagram", color: "border-pink-300 hover:border-pink-400 data-[active=true]:bg-pink-50 data-[active=true]:border-pink-500" },
  { value: "TIKTOK", label: "TikTok", color: "border-zinc-300 hover:border-zinc-400 data-[active=true]:bg-zinc-50 data-[active=true]:border-zinc-700" },
  { value: "YOUTUBE", label: "YouTube", color: "border-red-300 hover:border-red-400 data-[active=true]:bg-red-50 data-[active=true]:border-red-500" },
]

export function NewScanForm() {
  const router = useRouter()

  const [platform, setPlatform] = useState<Platform>("INSTAGRAM")
  const [mode, setMode] = useState<ImportMode>("text")
  const [url, setUrl] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const body = {
      platform,
      importMethod: mode === "url" ? "MANUAL_URL" : "MANUAL_TEXT",
      ...(mode === "url" ? { url } : { content }),
    }

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue")
        return
      }

      router.push(`/scanner/${data.scanResultId}`)
    } catch {
      setError("Impossible de joindre le serveur. Réessayez.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Choix de la plateforme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plateforme</CardTitle>
          <CardDescription>Sur quelle plateforme a été publiée cette publication ?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {PLATFORMS.map(({ value, label, color }) => (
              <button
                key={value}
                type="button"
                data-active={platform === value}
                onClick={() => setPlatform(value)}
                className={cn(
                  "rounded-lg border-2 py-3 px-4 text-sm font-medium transition-colors text-center",
                  color
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mode d'import */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Méthode d'import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              data-active={mode === "text"}
              onClick={() => setMode("text")}
              className={cn(
                "flex items-center gap-2 rounded-lg border-2 py-3 px-4 text-sm font-medium transition-colors",
                mode === "text"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-zinc-200 hover:border-zinc-300 text-zinc-600"
              )}
            >
              <FileText className="h-4 w-4" />
              Coller le texte
            </button>
            <button
              type="button"
              data-active={mode === "url"}
              onClick={() => setMode("url")}
              className={cn(
                "flex items-center gap-2 rounded-lg border-2 py-3 px-4 text-sm font-medium transition-colors",
                mode === "url"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-zinc-200 hover:border-zinc-300 text-zinc-600"
              )}
            >
              <LinkIcon className="h-4 w-4" />
              URL de la publication
            </button>
          </div>

          {mode === "url" && (
            <div className="space-y-2">
              <Label htmlFor="url">URL de la publication</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://www.instagram.com/p/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <p className="text-xs text-zinc-400">
                Collez le lien direct vers la publication.
              </p>
            </div>
          )}

          {mode === "text" && (
            <div className="space-y-2">
              <Label htmlFor="content">Contenu de la publication</Label>
              <textarea
                id="content"
                rows={8}
                placeholder="Collez ici la légende, description ou texte de votre publication…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                minLength={10}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-zinc-400">
                Incluez hashtags, mentions et toute la description.{" "}
                <span className="text-zinc-500">{content.length} caractère{content.length !== 1 ? "s" : ""}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info légale */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
        <strong>Analyse selon la loi 2023-451</strong> — Le scanner vérifie la présence des mentions
        publicitaires obligatoires et détecte les promotions de produits interdits (chirurgie esthétique,
        nicotine, crypto non régulé, paris sportifs…).
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyse en cours…
          </>
        ) : (
          "Lancer l'analyse"
        )}
      </Button>
    </form>
  )
}
