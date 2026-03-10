"use client"

import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"

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

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-zinc-200 bg-white shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <User className="h-4 w-4" />
          <span>{userName ?? userEmail}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-zinc-500 hover:text-zinc-900"
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Déconnexion</span>
        </Button>
      </div>
    </header>
  )
}
