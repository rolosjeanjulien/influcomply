"use client"

import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut, ChevronDown } from "lucide-react"

interface HeaderProps {
  userEmail?: string
  userName?: string
}

export function Header({ userEmail, userName }: HeaderProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createSupabaseClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const displayName = userName ?? userEmail?.split("@")[0] ?? "Utilisateur"
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-zinc-100 bg-white shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 transition-colors cursor-default">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-[10px] font-bold">
            {initials}
          </div>
          <span className="text-sm font-medium text-zinc-700">{displayName}</span>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-xl"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
