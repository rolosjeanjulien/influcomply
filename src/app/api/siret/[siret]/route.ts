// REQ-CTR-003 | SPC-CTR-001 — SIRET verification via INSEE Sirene API
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifySiret } from "@/services/contracts/siret-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ siret: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { siret } = await params;
  if (!/^\d{14}$/.test(siret)) {
    return NextResponse.json({ error: "SIRET invalide (14 chiffres requis)" }, { status: 400 });
  }

  const result = await verifySiret(siret);
  if (!result.isValid) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json(result);
}
