// REQ-CRT-002 | Génération du badge SVG dynamique embarquable
// Format shields.io-compatible + SVG natif

import type { BadgeStatus } from "@/types/certification"

const COLORS: Record<BadgeStatus, { bg: string; border: string; text: string }> = {
  CERTIFIED: { bg: "#dcfce7", border: "#16a34a", text: "#15803d" },
  ELIGIBLE:  { bg: "#dbeafe", border: "#2563eb", text: "#1d4ed8" },
  REVOKED:   { bg: "#fee2e2", border: "#dc2626", text: "#b91c1c" },
  NONE:      { bg: "#f1f5f9", border: "#94a3b8", text: "#64748b" },
}

const LABELS: Record<BadgeStatus, string> = {
  CERTIFIED: "InfluComply Certified",
  ELIGIBLE:  "InfluComply Eligible",
  REVOKED:   "Certification révoquée",
  NONE:      "Non certifié",
}

export function generateBadgeSvg(
  status: BadgeStatus,
  creatorName: string,
  score: number | null,
  certifiedSince: Date | null
): string {
  const { bg, border, text } = COLORS[status]
  const label = LABELS[status]
  const isCertified = status === "CERTIFIED"

  const scoreText = score !== null ? `Score: ${score}/100` : ""
  const sinceText =
    isCertified && certifiedSince
      ? `Certifié depuis le ${certifiedSince.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`
      : ""

  return `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="80" viewBox="0 0 280 80" role="img" aria-label="${label} — ${creatorName}">
  <title>${label} — ${creatorName}</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bg}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="0.8"/>
    </linearGradient>
  </defs>
  <!-- Fond -->
  <rect width="280" height="80" rx="12" ry="12" fill="url(#bg)" stroke="${border}" stroke-width="1.5"/>
  <!-- Icône shield -->
  <g transform="translate(16, 20)">
    ${isCertified
      ? `<path d="M20 2L4 8v8c0 8.8 6.8 17 16 19 9.2-2 16-10.2 16-19V8L20 2z" fill="${border}" opacity="0.15"/>
         <path d="M20 4L6 9.5v6.5c0 7.5 5.8 14.5 14 16.5 8.2-2 14-9 14-16.5V9.5L20 4z" fill="none" stroke="${border}" stroke-width="1.5"/>
         <path d="M14 20l4 4 8-8" stroke="${text}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<path d="M20 2L4 8v8c0 8.8 6.8 17 16 19 9.2-2 16-10.2 16-19V8L20 2z" fill="${border}" opacity="0.15"/>
         <path d="M20 4L6 9.5v6.5c0 7.5 5.8 14.5 14 16.5 8.2-2 14-9 14-16.5V9.5L20 4z" fill="none" stroke="${border}" stroke-width="1.5"/>`
    }
  </g>
  <!-- Textes -->
  <text x="58" y="28" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="12" font-weight="700" fill="${text}">${label}</text>
  <text x="58" y="44" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="11" fill="#374151">${escapeXml(creatorName)}</text>
  ${scoreText ? `<text x="58" y="58" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="10" fill="#6b7280">${scoreText}${sinceText ? " · " + sinceText : ""}</text>` : ""}
  <!-- Logo InfluComply -->
  <text x="258" y="74" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="7" fill="${border}" text-anchor="end" opacity="0.7">influcomply.fr</text>
</svg>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

// Format shields.io JSON pour intégration README
export function generateShieldsJson(status: BadgeStatus, score: number | null) {
  const isCertified = status === "CERTIFIED"
  return {
    schemaVersion: 1,
    label: "InfluComply",
    message: isCertified ? `Certified${score ? ` · ${score}/100` : ""}` : "Not certified",
    color: isCertified ? "brightgreen" : "lightgrey",
    namedLogo: "shield",
  }
}
