// Icônes de plateforme sociale
// REQ-SCN-001 — Instagram, TikTok, YouTube

import { cn } from "@/lib/utils"
import type { Platform } from "@/types/scanner"

interface PlatformIconProps {
  platform: Platform | string
  className?: string
}

export function PlatformIcon({ platform, className }: PlatformIconProps) {
  const colors: Record<string, string> = {
    INSTAGRAM: "text-pink-500",
    TIKTOK: "text-zinc-900",
    YOUTUBE: "text-red-500",
  }

  const labels: Record<string, string> = {
    INSTAGRAM: "IG",
    TIKTOK: "TK",
    YOUTUBE: "YT",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded font-bold text-xs",
        colors[platform] ?? "text-zinc-500",
        className
      )}
      title={platform}
      aria-label={platform}
    >
      {labels[platform] ?? platform.slice(0, 2)}
    </span>
  )
}

export function PlatformLabel({ platform }: { platform: Platform | string }) {
  const labels: Record<string, string> = {
    INSTAGRAM: "Instagram",
    TIKTOK: "TikTok",
    YOUTUBE: "YouTube",
  }
  return <>{labels[platform] ?? platform}</>
}
