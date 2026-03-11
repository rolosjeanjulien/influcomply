import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export const dynamic = "force-dynamic"

const DEMO_USER = {
  email: "marie.dupont@beautyagency.fr",
  name: "Marie Dupont",
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(url && key && url !== "https://placeholder.supabase.co" && key !== "placeholder" && url.includes(".supabase.co"))
}

async function getUser() {
  if (!isSupabaseConfigured()) {
    return { email: DEMO_USER.email, name: DEMO_USER.name }
  }
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    return { email: user.email, name: user.user_metadata?.name as string | undefined }
  } catch {
    return null
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header userEmail={user.email} userName={user.name} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
