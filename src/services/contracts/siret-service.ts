// Vérification SIRET via API INSEE Sirene
// SPC-CTR-007, REQ-INT-004 — avec cache 24h

import type { SiretVerificationResult } from "@/types/contract"

// Cache in-memory (Upstash Redis en production — SPC-CTR-007)
const siretCache = new Map<string, { result: SiretVerificationResult; expiresAt: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24h en ms

export async function verifySiret(
  siret: string
): Promise<SiretVerificationResult> {
  // Validation format
  const clean = siret.replace(/\s/g, "")
  if (!/^\d{14}$/.test(clean)) {
    return { siret: clean, isValid: false, error: "Format invalide (14 chiffres requis)", fromCache: false }
  }

  // Vérifier le cache
  const cached = siretCache.get(clean)
  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached.result, fromCache: true }
  }

  try {
    // API INSEE Sirene publique
    const res = await fetch(
      `https://api.insee.fr/entreprises/sirene/V3/siret/${clean}`,
      {
        headers: {
          Accept: "application/json",
          // En production : Authorization: `Bearer ${process.env.INSEE_API_TOKEN}`
        },
        next: { revalidate: 0 },
      }
    )

    if (res.status === 404) {
      const result: SiretVerificationResult = {
        siret: clean,
        isValid: false,
        error: "SIRET introuvable dans le répertoire Sirene",
        fromCache: false,
      }
      siretCache.set(clean, { result, expiresAt: Date.now() + CACHE_TTL })
      return result
    }

    if (!res.ok) {
      // Fallback : validation Luhn uniquement si l'API est indisponible
      return {
        siret: clean,
        isValid: isValidLuhn(clean),
        error: "API Sirene temporairement indisponible — validation format uniquement",
        fromCache: false,
      }
    }

    const data = await res.json()
    const etablissement = data.etablissement
    const uniteLegale = etablissement?.uniteLegale

    const result: SiretVerificationResult = {
      siret: clean,
      isValid: true,
      company: {
        name:
          uniteLegale?.denominationUniteLegale ??
          `${uniteLegale?.prenomUsuelUniteLegale ?? ""} ${uniteLegale?.nomUniteLegale ?? ""}`.trim(),
        address: [
          etablissement?.adresseEtablissement?.numeroVoieEtablissement,
          etablissement?.adresseEtablissement?.typeVoieEtablissement,
          etablissement?.adresseEtablissement?.libelleVoieEtablissement,
          etablissement?.adresseEtablissement?.codePostalEtablissement,
          etablissement?.adresseEtablissement?.libelleCommuneEtablissement,
        ]
          .filter(Boolean)
          .join(" "),
        activity:
          etablissement?.uniteLegale?.activitePrincipaleUniteLegale ?? "",
        isActive:
          etablissement?.periodeEtablissement?.etatAdministratifEtablissement === "A",
      },
      fromCache: false,
    }

    siretCache.set(clean, { result, expiresAt: Date.now() + CACHE_TTL })
    return result
  } catch {
    // Fallback validation format
    return {
      siret: clean,
      isValid: isValidLuhn(clean),
      error: "Impossible de joindre l'API Sirene — validation format uniquement",
      fromCache: false,
    }
  }
}

// Algorithme de Luhn pour validation de format SIRET
function isValidLuhn(siret: string): boolean {
  let sum = 0
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(siret[i], 10)
    if (i % 2 === 0) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}
