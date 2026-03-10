# Spécifications Techniques — Regulatory Intelligence (REG)

## SPC-REG-001 — Base de connaissances juridique vectorisée

- **Trace** : REQ-REG-001
- **Composant** : `RegulatoryDB`
- **Techno** : PostgreSQL, pgvector, Claude embeddings
- **Description** : Créer une table `regulatory_texts` avec colonnes : `id`, `title`, `type` (loi/decret/ordonnance/guide/position), `source_url`, `effective_date`, `content` (text), `embedding` (vector(1536)). Indexer avec pgvector (index IVFFlat) pour la recherche sémantique. Peupler initialement avec : loi 2023-451, ordonnance 6 nov 2024, décret contractualisation 2026, guides ARPP, guide de bonne conduite DGCCRF. Chunking : découper les textes longs en paragraphes de ~500 tokens avec overlap de 50 tokens.
- **Critères d'acceptation** : Base peuplée avec tous les textes fondamentaux ; Recherche sémantique fonctionnelle (top-5 pertinent pour une question test).
- **Localisation** : `src/services/regulatory/regulatory-db.ts`, `prisma/schema.prisma`

## SPC-REG-002 — Veille réglementaire automatisée

- **Trace** : REQ-REG-002, REQ-REG-005
- **Composant** : `RegulatoryWatcher`
- **Techno** : Trigger.dev (cron), API DILA (Légifrance), Resend
- **Description** : Implémenter un job cron hebdomadaire (Trigger.dev) qui interroge l'API DILA (api.aife.economie.gouv.fr) pour détecter de nouveaux textes contenant les mots-clés : « influence commerciale », « influenceur », « créateur de contenu ». Alerte email aux admins pour validation humaine avant diffusion aux utilisateurs. Si validé, le texte est ajouté à la base et les utilisateurs sont notifiés.
- **Critères d'acceptation** : Détection de nouveau texte en <48 h ; Validation humaine avant diffusion ; Notification utilisateurs après validation.
- **Localisation** : `src/trigger/regulatory-watch.ts`

## SPC-REG-003 — Chatbot RAG réglementaire

- **Trace** : REQ-REG-003, REQ-REG-004
- **Composant** : `RegulatoryChat`
- **Techno** : Claude API, pgvector, Vercel AI SDK
- **Description** : Implémenter un chatbot RAG en 4 étapes : (1) embedding de la question utilisateur via Claude API, (2) recherche vectorielle dans `regulatory_texts` (top 5 chunks les plus similaires), (3) prompt Claude avec contexte récupéré + instruction systématique de citer les articles de loi utilisés, (4) affichage de la réponse avec liens cliquables vers les articles cités. System prompt incluant le disclaimer : « Cette information est fournie à titre indicatif et ne constitue pas un conseil juridique. » Bouton « Prendre RDV avec un avocat partenaire » intégré sous chaque réponse.
- **Critères d'acceptation** : Réponses sourcées (au moins 1 article cité) ; Disclaimer affiché systématiquement ; Bouton avocat présent.
- **Localisation** : `src/services/regulatory/regulatory-chat.ts`, `src/components/shared/chat/`

## SPC-REG-004 — Moteur de règles configurable

- **Trace** : REQ-REG-005
- **Composant** : `RulesEngine`
- **Techno** : JSON config, Admin UI, Next.js
- **Description** : Structurer le moteur de règles de scan comme un fichier de configuration JSON versionné (`compliance-rules.json`). Chaque règle : `id`, `category`, `pattern` (regex ou semantic), `severity` (critical/warning/info), `legal_ref` (article de loi), `points_penalty`, `active` (boolean). Interface admin pour activer/désactiver/modifier les règles sans redéploiement. Versionner chaque modification (table `rules_history`).
- **Critères d'acceptation** : Règles modifiables via admin UI ; Pas de redéploiement nécessaire ; Historique des modifications conservé.
- **Localisation** : `src/services/scanner/rules-engine.ts`, `src/app/(auth)/admin/rules/`
