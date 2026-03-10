# Exigences — Compliance Dashboard (DSH)

> Tableaux de bord de pilotage pour les trois personas : créateur, agence et annonceur.

## Exigences

| ID | Titre | Exigence | Type | Prio | Source | Vérification | Rationale |
|----|-------|----------|------|------|--------|-------------|-----------|
| REQ-DSH-001 | Vue multi-créateurs | Le système DOIT fournir aux utilisateurs de type « agence » un tableau de bord affichant les scores de conformité agrégés et individuels de l'ensemble des créateurs de leur portefeuille. | F | P0 | Persona agence | Test multi-tenant | Les agences gèrent 10 à 100+ créateurs simultanément. |
| REQ-DSH-002 | Score global organisation | Le système DOIT calculer et afficher un score de conformité global pour chaque organisation (agence ou marque), agrégé depuis les scores individuels. | F | P1 | PRD §4.3 | Test calcul agrégé | Vue stratégique pour les dirigeants d'agence. |
| REQ-DSH-003 | Rapports d'audit exportables | Le système DOIT permettre l'export de rapports d'audit de conformité au format PDF, incluant : période, publications scannées, non-conformités détectées, corrections effectuées, score final. | F | P0 | Contrôle DGCCRF | Test export + validation contenu | Preuve opposable en cas de contrôle. |
| REQ-DSH-004 | Scoring pré-campagne | Le système DEVRAIT permettre à un annonceur de consulter le score de conformité d'un créateur avant de lancer une campagne, sans nécessiter l'accord préalable du créateur si celui-ci a activé son profil public. | F | P1 | Persona annonceur | Test flux B2B | Réduit le risque pour l'annonceur (responsabilité solidaire). |
| REQ-DSH-005 | Filtres et recherche | Le système DOIT permettre le filtrage des créateurs et publications par : plateforme, score de conformité, type de non-conformité, période, statut d'alerte. | F | P0 | Utilisabilité | Test fonctionnel filtres | Navigation efficace dans des volumes importants. |
| REQ-DSH-006 | Tendances et historique | Le système DEVRAIT afficher l'évolution du score de conformité dans le temps sous forme de graphiques (par créateur et par organisation). | F | P1 | PRD §4.3 | Test visualisation | Permet de mesurer la progression et l'impact des actions correctives. |
