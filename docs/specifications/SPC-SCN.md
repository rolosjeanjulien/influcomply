# Spécifications Techniques — Publication Compliance Scanner (SCN)

## SPC-SCN-001 — Service OAuth2 plateformes

- **Trace** : REQ-SCN-001, REQ-NFR-006
- **Composant** : `AuthService`, `PlatformConnector`
- **Techno** : Next.js API Routes, Supabase Vault
- **Description** : Implémenter le service OAuth2 pour Instagram Graph API (Business/Creator accounts), TikTok Business API, YouTube Data API v3. Stocker les refresh tokens chiffrés (AES-256) en base via Supabase Vault. Renouveler automatiquement les access tokens avant expiration.
- **Critères d'acceptation** : Connexion réussie sur chaque plateforme ; Token renouvelé automatiquement ; Tokens chiffrés en base.

## SPC-SCN-002 — Extension navigateur

- **Trace** : REQ-SCN-002
- **Composant** : `BrowserExtension`, `ScanAPI`
- **Techno** : Chrome Extensions API (Manifest V3)
- **Description** : Développer une extension Chrome/Firefox (Manifest V3) qui extrait les métadonnées d'une publication visible dans le navigateur (texte, hashtags, mentions, média) et les envoie à l'API InfluComply via un endpoint dédié `POST /api/scan/browser-extension`.
- **Critères d'acceptation** : Extension publiée sur Chrome Web Store ; Données extraites correctement ; Scan déclenché automatiquement.

## SPC-SCN-003 — Scan manuel (URL / fichier / texte)

- **Trace** : REQ-SCN-002
- **Composant** : `ScanAPI`, `ContentFetcher`
- **Techno** : Next.js API Routes, Playwright
- **Description** : Implémenter un endpoint `POST /api/scan/manual` acceptant : (a) une URL de publication, (b) un fichier image/vidéo, (c) un texte copié-collé. Utiliser un web scraper headless (Playwright) pour récupérer le contenu des URL publiques.
- **Critères d'acceptation** : Import URL OK ; Import fichier OK ; Import texte OK.

## SPC-SCN-004 — Pipeline NLP détection mention

- **Trace** : REQ-SCN-003
- **Composant** : `NLPPipeline`, `MentionDetector`
- **Techno** : Claude API, Tesseract.js, Regex engine
- **Description** : Implémenter un pipeline NLP en 3 étapes : (1) extraction de texte (caption, sous-titres, OCR sur images via Tesseract), (2) recherche de patterns regex pour les mentions obligatoires (« Publicité », « Collaboration commerciale », « #pub », « #ad », etc.), (3) classification sémantique via Claude API pour les cas ambigus (mention présente mais pas assez visible, formulation détournée).
- **Critères d'acceptation** : Détection mention >95% recall ; Faux positifs <5%.

## SPC-SCN-005 — Classifieur produits interdits

- **Trace** : REQ-SCN-004
- **Composant** : `ContentClassifier`
- **Techno** : Claude API, JSON schema
- **Description** : Implémenter un classifieur multi-labels utilisant Claude API avec un system prompt spécialisé et une liste de catégories interdites paramétrable. Catégories : `surgery`, `nicotine`, `therapeutic_abstention`, `unregulated_crypto`, `gambling_minors`, `counterfeit`. Utiliser un golden dataset de 500+ exemples annotés pour le benchmark. Seuil de confiance : 0.85.
- **Critères d'acceptation** : Accuracy >90% ; Recall >95% sur catégories interdites.

## SPC-SCN-006 — Moteur de scoring pondéré

- **Trace** : REQ-SCN-005
- **Composant** : `ScoringEngine`
- **Techno** : TypeScript, PostgreSQL JSONB
- **Description** : Implémenter un moteur de scoring pondéré : mention publicitaire (40pts), produits interdits (30pts), images retouchées (15pts), autres règles (15pts). Score = 100 - somme des pénalités. Stocker le détail dans `ScanResult` (JSONB). Le scoring doit être configurable via `compliance-rules.json`.
- **Critères d'acceptation** : Score cohérent et reproductible ; Décomposition en sous-scores visible dans l'API et l'UI.
- **Localisation code** : `src/services/scanner/scoring-engine.ts`

## SPC-SCN-007 — Notifications multi-canal

- **Trace** : REQ-SCN-006
- **Composant** : `NotificationService`
- **Techno** : Supabase Realtime, Resend, Trigger.dev
- **Description** : Implémenter un système de notifications multi-canal : (a) notification in-app via Supabase Realtime (subscription channel par user), (b) email via Resend (template React Email), (c) webhook configurable vers un endpoint tiers. Déclenchement par un job asynchrone (Trigger.dev) post-scan avec SLA 15 min max.
- **Critères d'acceptation** : Notification reçue en <15 min ; 3 canaux fonctionnels ; Préférences utilisateur respectées.

## SPC-SCN-008 — Suggestions correctives IA

- **Trace** : REQ-SCN-007
- **Composant** : `SuggestionEngine`
- **Techno** : Claude API
- **Description** : Utiliser Claude API pour générer des suggestions correctives contextualisées : texte de mention à ajouter, formulation adaptée à la plateforme (Instagram caption vs TikTok description vs YouTube description). Prompt incluant des exemples de bonnes pratiques ARPP.
- **Critères d'acceptation** : Suggestion pertinente et exploitable ; Adaptée à la plateforme cible.

## SPC-SCN-009 — Détection retouche image

- **Trace** : REQ-SCN-008
- **Composant** : `ImageAnalyzer`
- **Techno** : Sharp.js, EXIF parser
- **Description** : Analyser les métadonnées EXIF (logiciel d'édition, date modification, profil couleur) et appliquer des heuristiques de détection de retouche (ratio compression JPEG, présence de logiciel de retouche dans les métadonnées). Alerter si retouche probable et mention « image retouchée » absente.
- **Critères d'acceptation** : Détection retouche via EXIF fonctionnelle ; Alerte si mention absente.

## SPC-SCN-010 — Rétention et purge des données de scan

- **Trace** : REQ-SCN-009, REQ-NFR-013
- **Composant** : `DataRetention`
- **Techno** : PostgreSQL, Trigger.dev (cron)
- **Description** : Stocker chaque `ScanResult` avec horodatage, hash SHA-256 du contenu scanné, résultat détaillé. Politique de rétention : 3 ans minimum. Implémenter une tâche cron hebdomadaire (Trigger.dev) de purge des données > 5 ans.
- **Critères d'acceptation** : Données conservées 3 ans minimum ; Purge automatisée sans intervention manuelle.
- **Localisation** : `src/trigger/data-retention.ts`

## SPC-SCN-011 — Scan batch parallèle

- **Trace** : REQ-SCN-010
- **Composant** : `BatchScanner`
- **Techno** : Trigger.dev, Supabase Realtime
- **Description** : Implémenter un job batch (Trigger.dev) qui récupère via l'API connectée les N dernières publications d'un créateur et les scanne en parallèle (concurrency: 10). Progress bar en temps réel via Supabase Realtime (channel `scan-progress:{job_id}`).
- **Critères d'acceptation** : 100 publications scannées en <5 min ; Progress bar temps réel fonctionnelle.
- **Localisation** : `src/trigger/scan-batch.ts`
