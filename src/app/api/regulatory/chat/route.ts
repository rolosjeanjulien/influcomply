// REQ-REG-003, REQ-REG-004 | Chatbot RAG réglementaire
import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ragChat } from "@/services/regulatory/rag-service"
import { z } from "zod"

const chatSchema = z.object({
  question: z.string().min(3).max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .max(12)
    .optional()
    .default([]),
})

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = chatSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Requête invalide", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const response = await ragChat(parsed.data.question, parsed.data.history)
  return NextResponse.json(response)
}
