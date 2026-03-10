# Spécifications Techniques — Interfaces & Intégrations (INT)

## SPC-INT-001 — API REST publique versionnée

- **Trace** : REQ-INT-001
- **Composant** : `PublicAPI`
- **Techno** : Next.js API Routes, OpenAPI 3.0, zod-to-openapi
- **Description** : Exposer une API REST versionnée (`/api/v1/`) documentée via OpenAPI 3.0 (auto-générée avec `zod-to-openapi` depuis les schémas Zod existants). Endpoints principaux : `POST /api/v1/scan` (déclencher un scan), `GET /api/v1/contracts` (lister les contrats), `GET /api/v1/creators/{id}/score` (score de conformité), `GET /api/v1/compliance-check` (vérification rapide d'une URL). Authentification : API key (header `X-API-Key`) pour les partenaires + JWT pour les utilisateurs connectés. Rate limiting par API key : 1000 req/heure (plan Agency), 5000 req/heure (plan Enterprise).
- **Critères d'acceptation** : Documentation Swagger accessible à `/api/docs` ; Auth API key fonctionnelle ; Rate limiting appliqué ; Versionnée (`/v1/`).
- **Localisation** : `src/app/api/v1/`

## SPC-INT-002 — Système de webhooks

- **Trace** : REQ-INT-002
- **Composant** : `WebhookService`
- **Techno** : Next.js API, HMAC-SHA256, Trigger.dev
- **Description** : Implémenter un système de webhooks sortants. Table `webhook_subscriptions` : `id`, `org_id`, `url`, `events[]` (scan_completed, alert_created, contract_signed, score_changed), `secret` (pour signature HMAC), `active`. À chaque événement, envoyer un POST signé (header `X-Webhook-Signature` = HMAC-SHA256 du body avec le secret) au webhook enregistré. Retry policy : 3 tentatives avec backoff exponentiel (1s, 10s, 60s). Logging de chaque envoi (succès/échec) dans `webhook_logs`.
- **Critères d'acceptation** : Webhooks envoyés sur événement ; Signature HMAC vérifiable ; Retry 3x avec backoff ; Logs consultables.
- **Localisation** : `src/services/webhooks/`

## SPC-INT-003 — Intégration Yousign

- **Trace** : REQ-INT-003
- **Composant** : `YousignIntegration`
- **Techno** : Yousign API v3, Webhooks
- **Description** : Créer un service dédié encapsulant l'API Yousign v3 : `createSignatureRequest()`, `uploadDocument()`, `addSigner(email, firstName, lastName)`, `activateSignatureRequest()`, `getSignatureRequestStatus()`. Webhook Yousign configuré sur l'endpoint `POST /api/webhooks/yousign` pour recevoir les événements de signature (completed, refused, expired). À réception d'un webhook `completed`, mettre à jour le statut du contrat et télécharger le document signé dans Supabase Storage.
- **Critères d'acceptation** : Flux de signature end-to-end fonctionnel ; Webhook reçu et traité ; Document signé archivé automatiquement.
- **Localisation** : `src/services/contracts/yousign-integration.ts`, `src/app/api/webhooks/yousign/route.ts`

## SPC-INT-004 — Service de vérification SIRET

- **Trace** : REQ-INT-004
- **Composant** : `SiretService`
- **Techno** : API Sirene INSEE, Upstash Redis
- **Description** : Service appelant l'API Sirene : `GET https://api.insee.fr/entreprises/sirene/V3.11/siret/{siret}`. Parser la réponse : `etatAdministratifEtablissement` (A=actif, F=fermé), `denominationUniteLegale`, `adresseEtablissement`. Cache Redis 24h pour éviter les appels répétitifs au même SIRET. Gestion des erreurs : SIRET inexistant, API indisponible, quota dépassé.
- **Critères d'acceptation** : Vérification SIRET correcte ; Cache 24h fonctionnel ; Erreurs gérées gracieusement (fallback UI).
- **Localisation** : `src/services/contracts/siret-service.ts`
