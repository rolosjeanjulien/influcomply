# Spécifications Techniques — Non-Fonctionnelles & Infrastructure (NFR)

## SPC-NFR-001 — Optimisation performance

- **Trace** : REQ-NFR-001
- **Composant** : `PerformanceOptim`
- **Techno** : PostgreSQL index, Upstash Redis, Vercel CDN
- **Description** : Optimiser les requêtes PostgreSQL avec index composés (`creator_id, created_at`), (`org_id, created_at`), (`publication_id`). Utiliser le cache Redis (Upstash) pour les scores calculés (TTL 5 min) et les profils publics (TTL 1h). CDN Vercel pour les assets statiques. Benchmark avec k6 : p95 < 2s sur les 10 endpoints principaux.
- **Critères d'acceptation** : p95 < 2s vérifié par benchmark k6 ; Index créés ; Cache Redis opérationnel.

## SPC-NFR-002 — Optimisation scan batch

- **Trace** : REQ-NFR-002
- **Composant** : `BatchOptim`
- **Techno** : Trigger.dev, Circuit breaker pattern
- **Description** : Configurer les jobs batch Trigger.dev avec `concurrency: 10`, `timeout: 300s`. Implémenter un circuit breaker sur les appels API plateforme (3 échecs consécutifs → backoff 30s, puis retry). Logging structuré de chaque étape pour le debugging.
- **Critères d'acceptation** : 100 publications scannées en < 5 min ; Circuit breaker fonctionnel ; Pas de timeout non géré.

## SPC-NFR-003 — Infrastructure et monitoring

- **Trace** : REQ-NFR-003
- **Composant** : `InfraReliability`
- **Techno** : Vercel, Supabase, Checkly (ou Better Uptime)
- **Description** : Déployer sur Vercel (frontend + API routes) + Supabase Cloud (base de données, auth, storage). Configurer un health check endpoint `GET /api/health` retournant le statut de chaque dépendance (DB, Redis, API externe). Monitoring uptime via Checkly avec alerting Slack/email si downtime > 5 min.
- **Critères d'acceptation** : Uptime > 99.5% mesuré mensuellement ; Health check fonctionnel ; Alerting configuré.

## SPC-NFR-004 — Authentification et MFA

- **Trace** : REQ-NFR-005
- **Composant** : `AuthService`
- **Techno** : Supabase Auth, TOTP, TLS 1.3
- **Description** : Implémenter l'authentification via Supabase Auth avec support : email/password, OAuth Google, magic link. MFA optionnel via TOTP (Google Authenticator / Authy). Sessions JWT avec refresh token. TLS 1.3 forcé via Vercel (natif). Page de settings pour activer/désactiver MFA.
- **Critères d'acceptation** : 3 méthodes de connexion fonctionnelles ; MFA TOTP activable ; TLS 1.3 validé (SSL Labs A+).

## SPC-NFR-005 — Chiffrement des données sensibles

- **Trace** : REQ-NFR-006
- **Composant** : `EncryptionLayer`
- **Techno** : Supabase Vault, TLS 1.3
- **Description** : Chiffrement au repos : activer Supabase Vault pour les secrets (tokens OAuth, clés API tierces). Les contrats signés sont dans un bucket Storage chiffré server-side. Chiffrement en transit : TLS 1.3 natif (Vercel + Supabase).
- **Critères d'acceptation** : Tokens OAuth chiffrés via Vault ; TLS 1.3 validé ; Aucun secret en clair en base.

## SPC-NFR-006 — Résidence des données EU

- **Trace** : REQ-NFR-007
- **Composant** : `DataResidency`
- **Techno** : Supabase EU region, Audit fournisseurs
- **Description** : Déployer Supabase sur la région `eu-west`. Vérifier que tous les services tiers traitent les données en EU : Resend (EU processing), Trigger.dev (EU), Yousign (France), Upstash (EU region). Documenter la localisation de chaque service dans un registre des traitements RGPD.
- **Critères d'acceptation** : Toutes les données personnelles hébergées en EU ; Registre des traitements documenté.

## SPC-NFR-007 — Droit à l'effacement

- **Trace** : REQ-NFR-008
- **Composant** : `DataDeletion`
- **Techno** : Next.js API, Trigger.dev
- **Description** : Implémenter un endpoint `DELETE /api/users/me/data` qui déclenche un job asynchrone : (1) anonymiser les données personnelles (nom, email → hash), (2) supprimer les fichiers associés dans Storage, (3) conserver les données agrégées anonymisées pour les statistiques. Email de confirmation envoyé. Délai : 30 jours max.
- **Critères d'acceptation** : Suppression complète des données personnelles ; Fichiers supprimés ; Données agrégées conservées ; Délai < 30 jours.

## SPC-NFR-008 — Export des données utilisateur

- **Trace** : REQ-NFR-009
- **Composant** : `DataExport`
- **Techno** : Next.js API, JSON
- **Description** : Implémenter un endpoint `GET /api/users/me/export` retournant un fichier JSON structuré contenant : profil utilisateur, publications scannées, résultats de scan, contrats, alertes, historique de scores. Fichier téléchargeable en un clic depuis la page Settings.
- **Critères d'acceptation** : Export complet et fidèle ; Format JSON valide ; Téléchargement fonctionnel.

## SPC-NFR-009 — Multi-tenancy RLS

- **Trace** : REQ-NFR-012
- **Composant** : `MultiTenancy`
- **Techno** : Supabase RLS, Vitest
- **Description** : Implémenter la Row Level Security (RLS) Supabase sur toutes les tables contenant des données utilisateur. Politique : `auth.uid() = user_id OR user belongs to org_id` (vérification via table `org_members`). Tests d'isolation inter-tenants automatisés : créer 2 organisations de test et vérifier qu'aucune requête ne leak des données.
- **Critères d'acceptation** : RLS actif sur toutes les tables ; Tests d'isolation passent ; Aucun leak de données.
- **Localisation** : `prisma/schema.prisma`, `supabase/migrations/`

## SPC-NFR-010 — Journal d'audit immuable

- **Trace** : REQ-NFR-013
- **Composant** : `AuditLog`
- **Techno** : PostgreSQL, Trigger SQL
- **Description** : Créer une table `audit_log` immuable (INSERT only, politique RLS interdisant UPDATE/DELETE). Colonnes : `id`, `user_id`, `action` (enum: scan, contract_create, contract_sign, alert_resolve, login, settings_change, etc.), `resource_type`, `resource_id`, `timestamp`, `ip_address`, `payload_diff` (JSONB). Trigger PostgreSQL `AFTER INSERT/UPDATE/DELETE` sur les tables critiques pour alimenter automatiquement le log.
- **Critères d'acceptation** : Log immuable (pas de modification possible) ; Toutes les actions critiques journalisées ; Consultable via admin UI.
- **Localisation** : `supabase/migrations/`, `src/app/(auth)/admin/audit/`
