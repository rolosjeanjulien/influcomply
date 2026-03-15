// REQ-CTR-001 — API d'extraction IA depuis proposition commerciale

import { NextRequest, NextResponse } from "next/server"
import { extractProposalData } from "@/services/contracts/proposal-extractor"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    let text: string | null = null

    // Mode 1 : texte collé directement
    const pastedText = formData.get("text") as string | null
    if (pastedText?.trim()) {
      text = pastedText.trim()
    }

    // Mode 2 : fichier PDF uploadé
    const file = formData.get("file") as File | null
    if (file && file.type === "application/pdf") {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Dynamic import to avoid edge runtime issues
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse")
      const pdfData = await pdfParse(buffer)
      text = pdfData.text
    }

    if (!text) {
      return NextResponse.json(
        { error: "Aucun texte ou PDF fourni" },
        { status: 400 }
      )
    }

    if (text.length > 20000) {
      text = text.slice(0, 20000)
    }

    const extracted = await extractProposalData(text)

    return NextResponse.json({ success: true, data: extracted })
  } catch (error) {
    console.error("Extraction error:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'analyse de la proposition" },
      { status: 500 }
    )
  }
}
