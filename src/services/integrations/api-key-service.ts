// REQ-INT-001 | Gestion des clés API — création, validation, révocation
// Format : ic_live_<32 chars hex> — stocké en SHA-256 dans la DB

import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import type { ApiKeyData, ApiKeyCreated, ApiTier } from "@/types/integrations"

const KEY_PREFIX = "ic_live_"

// ─── Génération ───────────────────────────────────────────────────────────

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const secret = crypto.randomBytes(32).toString("hex")
  const key = `${KEY_PREFIX}${secret}`
  const hash = crypto.createHash("sha256").update(key).digest("hex")
  const prefix = key.slice(0, 12) // "ic_live_XXXX"
  return { key, hash, prefix }
}

// ─── Création ─────────────────────────────────────────────────────────────

export async function createApiKey(
  userId: string,
  name: string,
  tier: ApiTier = "FREE",
  expiresInDays?: number
): Promise<ApiKeyCreated> {
  const { key, hash, prefix } = generateApiKey()
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null

  const record = await prisma.apiKey.create({
    data: {
      userId,
      name,
      keyHash: hash,
      prefix,
      tier,
      expiresAt,
      isActive: true,
    },
  })

  return {
    id: record.id,
    name: record.name,
    prefix: record.prefix,
    tier: record.tier as ApiTier,
    lastUsedAt: record.lastUsedAt,
    expiresAt: record.expiresAt,
    isActive: record.isActive,
    createdAt: record.createdAt,
    key, // exposé une seule fois
  }
}

// ─── Validation d'une clé entrante ────────────────────────────────────────

export async function validateApiKey(
  rawKey: string
): Promise<{ userId: string | null; organizationId: string | null; tier: ApiTier } | null> {
  if (!rawKey.startsWith(KEY_PREFIX)) return null

  const hash = crypto.createHash("sha256").update(rawKey).digest("hex")

  const record = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
  })

  if (!record || !record.isActive) return null
  if (record.expiresAt && record.expiresAt < new Date()) return null

  // Mise à jour du lastUsedAt (non bloquant)
  prisma.apiKey
    .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {})

  return {
    userId: record.userId,
    organizationId: record.organizationId,
    tier: record.tier as ApiTier,
  }
}

// ─── Liste et révocation ──────────────────────────────────────────────────

export async function getUserApiKeys(userId: string): Promise<ApiKeyData[]> {
  const keys = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })

  return keys.map((k: {
    id: string; name: string; prefix: string; tier: string;
    lastUsedAt: Date | null; expiresAt: Date | null; isActive: boolean; createdAt: Date
  }) => ({
    id: k.id,
    name: k.name,
    prefix: k.prefix,
    tier: k.tier as ApiTier,
    lastUsedAt: k.lastUsedAt,
    expiresAt: k.expiresAt,
    isActive: k.isActive,
    createdAt: k.createdAt,
  }))
}

export async function revokeApiKey(keyId: string, userId: string): Promise<void> {
  await prisma.apiKey.updateMany({
    where: { id: keyId, userId },
    data: { isActive: false },
  })
}
