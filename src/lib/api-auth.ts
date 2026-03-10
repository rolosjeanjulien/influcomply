// REQ-INT-001 | Middleware d'authentification API — Bearer token ou clé API
// Usage : import { requireApiAuth } from "@/lib/api-auth"

import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/services/integrations/api-key-service"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import type { ApiTier } from "@/types/integrations"
import { API_TIER_LIMITS } from "@/types/integrations"

export interface ApiContext {
  userId: string
  organizationId: string | null
  tier: ApiTier
  authMethod: "session" | "api_key"
}

// ─── Résolution du contexte API ───────────────────────────────────────────

export async function resolveApiContext(req: NextRequest): Promise<ApiContext | null> {
  // 1. Bearer token (clé API) — prioritaire pour les intégrations externes
  const authHeader = req.headers.get("authorization") ?? ""
  if (authHeader.startsWith("Bearer ic_live_")) {
    const rawKey = authHeader.slice(7)
    const result = await validateApiKey(rawKey)
    if (!result || !result.userId) return null
    return {
      userId: result.userId,
      organizationId: result.organizationId,
      tier: result.tier,
      authMethod: "api_key",
    }
  }

  // 2. Session cookie (dashboard)
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true },
    })
    if (!dbUser) return null

    return {
      userId: dbUser.id,
      organizationId: null,
      tier: "PRO", // les sessions dashboard ont accès complet
      authMethod: "session",
    }
  } catch {
    return null
  }
}

// ─── Rate limiting léger (en-mémoire, suffisant pour MVP) ────────────────
// En production : remplacer par Redis + sliding window

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(key: string, tier: ApiTier): boolean {
  const limits = API_TIER_LIMITS[tier]
  const now = Date.now()
  const windowMs = 60_000 // 1 minute

  const entry = rateLimitStore.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limits.reqPerMinute) return false
  entry.count++
  return true
}

// ─── Wrapper pour routes API v1 ───────────────────────────────────────────

export function withApiAuth(
  handler: (req: NextRequest, ctx: ApiContext, params: Record<string, string>) => Promise<NextResponse>
) {
  return async (req: NextRequest, routeCtx: { params: Promise<Record<string, string>> }) => {
    const params = await routeCtx.params
    const ctx = await resolveApiContext(req)

    if (!ctx) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Fournissez un Bearer token (clé API) ou une session valide." },
        { status: 401 }
      )
    }

    const rateLimitKey = `${ctx.userId}:${ctx.tier}`
    if (!checkRateLimit(rateLimitKey, ctx.tier)) {
      return NextResponse.json(
        { error: "Too Many Requests", message: `Limite de ${API_TIER_LIMITS[ctx.tier].reqPerMinute} req/min atteinte.` },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": String(API_TIER_LIMITS[ctx.tier].reqPerMinute),
          },
        }
      )
    }

    return handler(req, ctx, params)
  }
}
