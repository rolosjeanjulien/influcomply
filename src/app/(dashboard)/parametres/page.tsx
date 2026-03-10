// REQ-INT-001, REQ-INT-002 | Page Paramètres — profil, clés API, webhooks
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { getUserApiKeys } from "@/services/integrations/api-key-service"
import { listWebhookEndpoints } from "@/services/integrations/webhook-service"
import { ApiKeysPanel } from "@/components/integrations/api-keys-panel"
import { WebhooksPanel } from "@/components/integrations/webhooks-panel"
import { ParametresTabs } from "@/components/integrations/parametres-tabs"

export const metadata = { title: "Paramètres — InfluComply" }

export default async function ParametresPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) redirect("/login")

  const orgMember = await prisma.organizationMember.findFirst({
    where: { userId: dbUser.id },
    include: { organization: true },
  })

  const [apiKeys, webhookEndpoints] = await Promise.all([
    getUserApiKeys(dbUser.id),
    orgMember ? listWebhookEndpoints(orgMember.organizationId) : Promise.resolve([]),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Paramètres</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Profil, intégrations API, webhooks et sécurité
        </p>
      </div>

      <ParametresTabs
        profile={{
          name: dbUser.name ?? "",
          email: dbUser.email,
          slug: dbUser.slug ?? "",
          isPublic: dbUser.isPublic,
          organization: orgMember?.organization
            ? { name: orgMember.organization.name, siret: orgMember.organization.siret ?? "" }
            : null,
        }}
        apiKeysPanel={<ApiKeysPanel keys={apiKeys} />}
        webhooksPanel={<WebhooksPanel endpoints={webhookEndpoints} />}
      />
    </div>
  )
}
