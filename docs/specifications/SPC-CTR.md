# Spécifications Techniques — Contract Factory (CTR)

## SPC-CTR-001 — Templates de contrats conformes

- **Trace** : REQ-CTR-001, REQ-CTR-009
- **Composant** : `ContractTemplates`
- **Techno** : Handlebars, Puppeteer (PDF generation)
- **Description** : Créer 3 templates de contrats en HTML avec variables Handlebars : `{{creator_name}}`, `{{brand_name}}`, `{{amount}}`, `{{duration}}`, `{{rights_scope}}`, `{{territory}}`, etc. Clauses obligatoires incluses : objet de la collaboration, rémunération et avantages en nature, droits de propriété intellectuelle, clause de responsabilité solidaire (art. 6 loi 2023-451), mentions légales, durée et résiliation. Templates validés par cabinet d'avocats partenaire.
- **Critères d'acceptation** : 3 templates (créateur-marque, créateur-agent, créateur-agence) ; Toutes clauses obligatoires présentes ; Validation juridique documentée.
- **Localisation** : `src/services/contracts/templates/`

## SPC-CTR-002 — Wizard de création multi-étapes

- **Trace** : REQ-CTR-002
- **Composant** : `ContractWizard`
- **Techno** : React, Zod, shadcn/ui
- **Description** : Implémenter un wizard multi-étapes React (5 étapes max) avec validation côté client (Zod) et serveur. Étapes : (1) Type de collaboration → (2) Parties contractantes → (3) Conditions financières (montant, avantages en nature) → (4) Droits PI et territoire → (5) Révision et génération. État du wizard persisté côté client (React state) avec sauvegarde brouillon en base.
- **Critères d'acceptation** : 5 étapes navigables ; Validation Zod à chaque étape ; Génération PDF en fin de wizard ; Sauvegarde brouillon.
- **Localisation** : `src/components/contracts/wizard/`

## SPC-CTR-003 — Suivi du seuil 1 000 € HT

- **Trace** : REQ-CTR-003
- **Composant** : `ThresholdTracker`
- **Techno** : PostgreSQL, Trigger.dev
- **Description** : Implémenter un service de suivi du cumul par couple `(creator_id, advertiser_id, year)`. Table `GiftingLedger` avec colonnes : `amount`, `type` (cash/gift/travel/other), `date`, `description`, `contract_id`. Alerte à 800 € (warning jaune) et 1 000 € (obligation contractuelle, alerte rouge). Job Trigger.dev quotidien pour recalculer les cumuls.
- **Critères d'acceptation** : Cumul correct par couple créateur-annonceur ; Alerte à 800 € ; Alerte à 1 000 € ; Reset automatique au 1er janvier.
- **Localisation** : `src/services/contracts/threshold-tracker.ts`

## SPC-CTR-004 — Intégration signature Yousign

- **Trace** : REQ-CTR-004
- **Composant** : `SignatureService`
- **Techno** : Yousign API v3, Webhooks
- **Description** : Intégrer l'API Yousign v3 : `createProcedure()`, `uploadDocument()`, `addSigner()`, `getStatus()`. Webhook Yousign pour la notification de signature complétée → mise à jour statut contrat en base. Stocker le document signé dans Supabase Storage avec métadonnées eIDAS.
- **Critères d'acceptation** : Signature end-to-end fonctionnelle ; Webhook reçu et traité ; Document signé archivé.
- **Localisation** : `src/services/contracts/signature-service.ts`

## SPC-CTR-005 — Archivage chiffré des contrats

- **Trace** : REQ-CTR-005, REQ-NFR-006
- **Composant** : `ContractStorage`
- **Techno** : Supabase Storage, SHA-256
- **Description** : Stocker les contrats signés dans Supabase Storage (bucket privé, chiffrement server-side). Métadonnées en base : hash SHA-256 du document, horodatage signature, identité des signataires, statut eIDAS. Rétention : 5 ans minimum, purge configurable par l'admin.
- **Critères d'acceptation** : Chiffrement serveur actif ; Hash SHA-256 vérifiable ; Rétention 5 ans respectée.

## SPC-CTR-006 — State machine cycle de vie contrat

- **Trace** : REQ-CTR-006
- **Composant** : `ContractLifecycle`
- **Techno** : TypeScript enum + transitions, Trigger.dev (cron)
- **Description** : Implémenter une state machine pour le cycle de vie : `draft` → `pending_signature` → `signed` → `active` → `expired` | `terminated`. Transitions validées par des guards (ex: `signed` requiert `signed_url` non null). Notifications automatiques par email : 30 jours et 7 jours avant expiration.
- **Critères d'acceptation** : Transitions valides uniquement ; Notifications d'expiration envoyées ; Historique des transitions journalisé.
- **Localisation** : `src/services/contracts/contract-lifecycle.ts`, `src/trigger/contract-expiry.ts`

## SPC-CTR-007 — Vérification SIRET via API Sirene

- **Trace** : REQ-CTR-007
- **Composant** : `SiretChecker`
- **Techno** : API Sirene INSEE
- **Description** : Intégrer l'API Sirene (`api.insee.fr/entreprises/sirene/V3.11`) pour vérifier : existence du SIRET, état actif de l'établissement, dénomination, adresse. Afficher un badge ✅/❌ dans le wizard de création de contrat. Cache Redis 24h pour éviter les appels répétitifs.
- **Critères d'acceptation** : SIRET vérifié correctement ; Badge affiché ; Cache fonctionnel.

## SPC-CTR-008 — Export PDF et DOCX

- **Trace** : REQ-CTR-008
- **Composant** : `DocumentExporter`
- **Techno** : Puppeteer (PDF), docx (npm, DOCX)
- **Description** : Générer le contrat en PDF (Puppeteer headless rendering du template HTML) et en DOCX (librairie docx-js). Bouton de téléchargement avec choix du format. Le PDF doit inclure le disclaimer en pied de page.
- **Critères d'acceptation** : PDF généré correctement ; DOCX généré correctement ; Disclaimer présent.

## SPC-CTR-009 — Disclaimer non-masquable

- **Trace** : REQ-CTR-010
- **Composant** : `DisclaimerComponent`
- **Techno** : React component
- **Description** : Afficher un disclaimer non-masquable en pied de chaque contrat généré et sur l'écran de génération : « Ce document est généré automatiquement à titre informatif et ne constitue pas un conseil juridique. Consultez un avocat pour toute situation spécifique. » Le disclaimer ne peut pas être supprimé par l'utilisateur.
- **Critères d'acceptation** : Disclaimer visible sur l'écran de génération ; Disclaimer présent dans le PDF/DOCX exporté ; Non supprimable.
- **Localisation** : `src/components/contracts/disclaimer.tsx`
