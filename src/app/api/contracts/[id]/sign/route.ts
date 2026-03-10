// REQ-CTR-009, REQ-CTR-010 | SPC-CTR-001 — Yousign eIDAS signature initiation
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { initiateSignature } from "@/services/contracts/contract-service";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    const contract = await initiateSignature(id, dbUser.id, "");
    return NextResponse.json({
      contractId: contract.id,
      status: contract.status,
      yousignId: contract.yousignId,
      message: "Procédure de signature initiée",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur lors de l'initiation de la signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
