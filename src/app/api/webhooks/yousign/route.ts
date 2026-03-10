// REQ-CTR-010 | SPC-CTR-001 — Yousign webhook handler (HMAC-SHA256 verification)
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const YOUSIGN_SECRET = process.env.YOUSIGN_WEBHOOK_SECRET ?? "";

function verifySignature(payload: string, signature: string): boolean {
  if (!YOUSIGN_SECRET) return true; // dev: skip verification if no secret configured
  const expected = crypto.createHmac("sha256", YOUSIGN_SECRET).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-yousign-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { type: string; data: { signatureRequestId: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const yousignId = event?.data?.signatureRequestId;
  if (!yousignId) return NextResponse.json({ ok: true });

  // Map Yousign event types to contract status strings
  const statusMap: Record<string, string> = {
    "signature_request.done": "SIGNED",
    "signature_request.expired": "EXPIRED",
    "signature_request.canceled": "TERMINATED",
  };

  const newStatus = statusMap[event.type];
  if (newStatus) {
    await prisma.contract.updateMany({
      where: { yousignId },
      data: {
        status: newStatus,
        ...(newStatus === "SIGNED" ? { signedAt: new Date() } : {}),
      },
    });
  }

  return NextResponse.json({ ok: true });
}
