"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ScanSearch,
  FileText,
  BookOpen,
  BadgeCheck,
  Settings,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scanner", label: "Scanner", icon: ScanSearch },
  { href: "/contrats", label: "Contrats", icon: FileText },
  { href: "/veille", label: "Veille réglementaire", icon: BookOpen },
  { href: "/certification", label: "Certification", icon: BadgeCheck },
  { href: "/parametres", label: "Paramètres", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-white border-r border-zinc-200 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-200">
        <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0" />
        <span className="font-bold text-base tracking-tight">InfluComply</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-blue-600" : "text-zinc-400")} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Badge conformité en bas */}
      <div className="px-4 py-4 border-t border-zinc-200">
        <p className="text-xs text-zinc-400 text-center">
          Loi n° 2023-451 · DGCCRF
        </p>
      </div>
    </aside>
  )
}
