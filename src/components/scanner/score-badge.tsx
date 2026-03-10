// Composant badge de score de conformité
// REQ-SCN-006

import { cn } from "@/lib/utils"

interface ScoreBadgeProps {
  score: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

export function ScoreBadge({
  score,
  size = "sm",
  showLabel = false,
  className,
}: ScoreBadgeProps) {
  const color =
    score >= 80
      ? "bg-green-100 text-green-700 border-green-200"
      : score >= 50
      ? "bg-orange-100 text-orange-700 border-orange-200"
      : "bg-red-100 text-red-600 border-red-200"

  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold rounded-full border",
        color,
        sizes[size],
        className
      )}
    >
      {score}/100
      {showLabel && (
        <span className="font-normal">
          {score >= 80 ? "Conforme" : score >= 50 ? "À améliorer" : "Non conforme"}
        </span>
      )}
    </span>
  )
}
