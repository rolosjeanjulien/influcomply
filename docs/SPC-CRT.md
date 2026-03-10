# Spécifications Techniques — Certification & Badge (CRT)

## SPC-CRT-001 — Moteur d'attribution et révocation de badge

- **Trace** : REQ-CRT-001, REQ-CRT-004
- **Composant** : `BadgeEngine`
- **Techno** : Trigger.dev (cron), PostgreSQL
- **Description** : Implémenter un job cron quotidien (Trigger.dev, 02:00 UTC) qui recalcule l'éligibilité au badge pour chaque créateur actif. Critères d'attribution : score moyen > 80 sur 90 jours glissants ET aucune alerte critique non résolue. Critère de révocation : score moyen < 70 sur 30 jours glissants. Mettre à jour le champ `badge_status` (enum: `eligible`, `certified`, `revoked`, `none`). Envoyer une notification lors de l'attribution ou de la révocation.
- **Critères d'acceptation** : Badge attribué si éligible ; Révoqué si score < 70 ; Notification envoyée dans les deux cas ; Job quotidien fiable.
- **Localisation** : `src/trigger/badge-engine.ts`

## SPC-CRT-002 — API publique de vérification

- **Trace** : REQ-CRT-002
- **Composant** : `VerificationAPI`
- **Techno** : Next.js API, Rate limiting (Upstash)
- **Description** : Exposer un endpoint `GET /api/public/verify/{creator_slug}` retournant : `badge_status`, `score_current`, `certified_since`, `last_scan_date`. Rate limit : 100 requêtes/minute par IP (Upstash Redis rate limiter). Documentation OpenAPI auto-générée. Pas d'authentification requise (endpoint public).
- **Critères d'acceptation** : Endpoint public fonctionnel ; Rate limit appliqué ; Documentation OpenAPI générée ; Réponse JSON conforme au schéma.
- **Localisation** : `src/app/api/public/verify/[slug]/route.ts`

## SPC-CRT-003 — Annuaire public des créateurs certifiés

- **Trace** : REQ-CRT-003
- **Composant** : `DirectoryPage`
- **Techno** : Next.js SSR, PostgreSQL
- **Description** : Implémenter une page `/directory` avec liste paginée (20 résultats/page) des créateurs certifiés (`badge_status = 'certified'`). Filtres : plateforme (Instagram/TikTok/YouTube), thématique (beauty, gaming, lifestyle, food, fashion, tech), taille audience (nano/micro/mid/macro). SEO : Server-Side Rendering avec Next.js, méta-tags dynamiques, structured data (Schema.org Person).
- **Critères d'acceptation** : Page indexée par Google ; Filtres fonctionnels ; Pagination ; Structured data valide.
- **Localisation** : `src/app/(public)/directory/page.tsx`
