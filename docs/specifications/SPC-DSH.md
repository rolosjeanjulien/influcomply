# Spécifications Techniques — Compliance Dashboard (DSH)

## SPC-DSH-001 — Dashboard multi-tenant agence

- **Trace** : REQ-DSH-001, REQ-NFR-012
- **Composant** : `AgencyDashboard`
- **Techno** : Next.js, Supabase RLS, React Table
- **Description** : Implémenter un dashboard multi-tenant avec Supabase Row Level Security (RLS). Chaque requête filtrée par `org_id`. Vue liste de créateurs avec colonnes : nom, plateforme(s), score de conformité, dernière alerte, nombre de publications scannées, statut badge.
- **Critères d'acceptation** : Isolation tenant vérifiée (un utilisateur ne voit jamais les données d'une autre organisation) ; Vue multi-créateurs fonctionnelle.
- **Localisation** : `src/app/(auth)/dashboard/page.tsx`

## SPC-DSH-002 — Score global organisation

- **Trace** : REQ-DSH-002
- **Composant** : `OrgScoreCalculator`
- **Techno** : PostgreSQL view, React
- **Description** : Calculer le score global organisation comme la moyenne pondérée des scores créateurs (pondération par nombre de publications). Afficher en haut du dashboard avec indicateur de tendance (flèche haut/bas vs période précédente). Vue PostgreSQL matérialisée rafraîchie toutes les heures.
- **Critères d'acceptation** : Score correct mathématiquement ; Tendance affichée ; Refresh automatique.

## SPC-DSH-003 — Rapports d'audit PDF

- **Trace** : REQ-DSH-003
- **Composant** : `AuditReportGenerator`
- **Techno** : Puppeteer, Recharts (SSR)
- **Description** : Générer un rapport PDF d'audit via Puppeteer : page de garde (org, période, date génération), synthèse (score global, nb scans, nb non-conformités), détail par créateur, liste des non-conformités avec statut de résolution, graphique d'évolution. Endpoint : `GET /api/reports/audit?org_id=X&from=Y&to=Z`.
- **Critères d'acceptation** : PDF généré avec toutes les sections ; Contenu cohérent avec les données ; Téléchargement fonctionnel.

## SPC-DSH-004 — Profil de conformité public

- **Trace** : REQ-DSH-004, REQ-CRT-002
- **Composant** : `ComplianceProfile`
- **Techno** : Next.js API, PostgreSQL
- **Description** : Créer un endpoint `GET /api/creators/{id}/compliance-profile` retournant : score actuel, historique 90 jours, alertes actives, statut badge, dernière date de scan. Accessible publiquement si le créateur a activé son profil public (flag `is_public` en base).
- **Critères d'acceptation** : Endpoint fonctionnel ; Filtrage `is_public` respecté ; Données complètes.

## SPC-DSH-005 — Filtres combinables

- **Trace** : REQ-DSH-005
- **Composant** : `FilterComponent`
- **Techno** : React, nuqs, shadcn/ui
- **Description** : Implémenter un composant de filtres combinables avec React + URL search params (nuqs pour la persistance dans l'URL). Filtres : plateforme (multi-select), score (range slider 0-100), type non-conformité (checkboxes), période (date range picker), statut alerte (open/resolved/all).
- **Critères d'acceptation** : Tous les filtres fonctionnels ; URL persistante (partage de vue filtrée) ; Combinaison de filtres sans bug.
- **Localisation** : `src/components/dashboard/filters.tsx`

## SPC-DSH-006 — Graphiques d'évolution

- **Trace** : REQ-DSH-006
- **Composant** : `AnalyticsCharts`
- **Techno** : Recharts, PostgreSQL views
- **Description** : Implémenter 3 graphiques avec Recharts : (1) score de conformité sur 90 jours (line chart), (2) répartition des non-conformités par type (pie chart), (3) volume de scans par jour (bar chart). Données agrégées par jour via vues PostgreSQL matérialisées.
- **Critères d'acceptation** : 3 types de graphiques rendus ; Données cohérentes avec la base ; Responsive.
