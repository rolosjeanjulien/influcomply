// REQ-INT-002 | Service webhooks — dispatch HMAC-SHA256, retry exponentiel
// Architecture : émission → DB → délivrance asynchrone (3 tentatives max)

import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import type { WebhookEvent, WebhookPayload, WebhookEndpointData, DeliveryStatus } from "@/types/integrations"

const MAX_RETRIES = 3
const RETRY_DELAYS_MS = [30_000, 300_000, 1_800_000] // 30s, 5min, 30min

// ─── Signature HMAC-SHA256 ────────────────────────────────────────────────

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex")
}

// ─── Émission d'un événement vers tous les endpoints abonnés ─────────────

export async function dispatchWebhookEvent<T>(
  organizationId: string,
  event: WebhookEvent,
  data: T
): Promise<void> {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: {
      organizationId,
      isActive: true,
      events: { has: event },
    },
  })

  if (endpoints.length === 0) return

  const webhookPayload: WebhookPayload<T> = {
    id: crypto.randomUUID(),
    event,
    createdAt: new Date().toISOString(),
    data,
  }

  // Créer les enregistrements de délivrance et déclencher l'envoi
  await Promise.allSettled(
    endpoints.map(async (endpoint: { id: string; url: string; secret: string }) => {
      const delivery = await prisma.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          event,
          payload: webhookPayload as object,
          status: "PENDING",
        },
      })
      await deliverWebhook(delivery.id, endpoint.url, endpoint.secret, webhookPayload)
    })
  )
}

// ─── Délivrance d'un webhook (avec retry) ────────────────────────────────

export async function deliverWebhook<T>(
  deliveryId: string,
  url: string,
  secret: string,
  payload: WebhookPayload<T>
): Promise<void> {
  const body = JSON.stringify(payload)
  const signature = signPayload(body, secret)
  const timestamp = Date.now().toString()

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-InfluComply-Signature": `sha256=${signature}`,
        "X-InfluComply-Timestamp": timestamp,
        "X-InfluComply-Event": payload.event,
        "User-Agent": "InfluComply-Webhooks/1.0",
      },
      body,
      signal: AbortSignal.timeout(10_000), // 10s timeout
    })

    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: res.ok ? "DELIVERED" : "FAILED",
        responseCode: res.status,
        deliveredAt: res.ok ? new Date() : null,
        attempts: { increment: 1 },
      },
    })
  } catch {
    // Planifier un retry
    const delivery = await prisma.webhookDelivery.findUnique({ where: { id: deliveryId } })
    const attempts = (delivery?.attempts ?? 0) + 1

    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: attempts >= MAX_RETRIES ? "FAILED" : "PENDING",
        attempts,
        nextRetryAt:
          attempts < MAX_RETRIES
            ? new Date(Date.now() + RETRY_DELAYS_MS[attempts - 1])
            : null,
      },
    })
  }
}

// ─── CRUD endpoints ───────────────────────────────────────────────────────

export async function createWebhookEndpoint(
  organizationId: string,
  url: string,
  events: WebhookEvent[]
): Promise<WebhookEndpointData> {
  const secret = crypto.randomBytes(32).toString("hex")

  const endpoint = await prisma.webhookEndpoint.create({
    data: { organizationId, url, secret, events, isActive: true },
  })

  return {
    id: endpoint.id,
    url: endpoint.url,
    events: endpoint.events as WebhookEvent[],
    isActive: endpoint.isActive,
    createdAt: endpoint.createdAt,
  }
}

export async function listWebhookEndpoints(organizationId: string): Promise<WebhookEndpointData[]> {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { organizationId },
    include: {
      _count: { select: { deliveries: true } },
      deliveries: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return endpoints.map((e: {
    id: string; url: string; events: string[]; isActive: boolean; createdAt: Date;
    _count: { deliveries: number };
    deliveries: Array<{ status: string }>
  }) => ({
    id: e.id,
    url: e.url,
    events: e.events as WebhookEvent[],
    isActive: e.isActive,
    createdAt: e.createdAt,
    deliveriesCount: e._count.deliveries,
    lastDeliveryStatus: (e.deliveries[0]?.status ?? undefined) as DeliveryStatus | undefined,
  }))
}

export async function deleteWebhookEndpoint(endpointId: string, organizationId: string): Promise<void> {
  await prisma.webhookEndpoint.deleteMany({
    where: { id: endpointId, organizationId },
  })
}

// ─── Récupération du secret (pour affichage one-time) ────────────────────

export async function getWebhookSecret(endpointId: string, organizationId: string): Promise<string | null> {
  const endpoint = await prisma.webhookEndpoint.findFirst({
    where: { id: endpointId, organizationId },
    select: { secret: true },
  })
  return endpoint?.secret ?? null
}
