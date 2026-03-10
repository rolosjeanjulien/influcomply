// REQ-CRT-001, REQ-CRT-004 | Cron Trigger.dev — évaluation mensuelle des badges
// Exécuté le 1er de chaque mois à 02:00 UTC
// Dépendance : @trigger.dev/sdk — à installer via : npm install @trigger.dev/sdk
//
// Pour activer en production :
//   1. npm install @trigger.dev/sdk
//   2. Décommenter le bloc en bas de ce fichier
//   3. Ajouter TRIGGER_SECRET_KEY dans les variables d'environnement Vercel

import {
  runBadgeEvaluationForAll,
  evaluateCreatorBadge,
} from "@/services/certification/badge-engine"

// ─── Stub de compatibilité (Trigger.dev non installé) ────────────────────

const logger = {
  info: (msg: string, data?: Record<string, unknown>) =>
    console.log(`[Trigger] ${msg}`, data ?? ""),
}

export const badgeEvaluationCron = {
  id: "badge-evaluation-monthly",
  cron: "0 2 1 * *", // 1er du mois à 02:00 UTC
  run: async () => {
    logger.info("Badge evaluation started")
    const results = await runBadgeEvaluationForAll()
    logger.info("Badge evaluation completed", results)
    return results
  },
}

export const evaluateSingleCreator = {
  id: "badge-evaluate-single",
  run: async (payload: { userId: string }) => {
    const result = await evaluateCreatorBadge(payload.userId)
    logger.info("Single badge evaluation", result as unknown as Record<string, unknown>)
    return result
  },
}

/* ─── Version Trigger.dev v3 (décommenter en production) ─────────────────
import { schedules, logger } from "@trigger.dev/sdk/v3"

export const badgeEvaluationCron = schedules.task({
  id: "badge-evaluation-monthly",
  cron: "0 2 1 * *",
  run: async () => {
    logger.info("Badge evaluation started")
    const results = await runBadgeEvaluationForAll()
    logger.info("Badge evaluation completed", results)
    return results
  },
})

export const evaluateSingleCreator = schedules.task({
  id: "badge-evaluate-single",
  run: async (payload: { userId: string }) => {
    const result = await evaluateCreatorBadge(payload.userId)
    logger.info("Single badge evaluation", result)
    return result
  },
})
*/
