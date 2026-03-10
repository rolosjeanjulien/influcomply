# Exigences — Non-Fonctionnelles (NFR)

> Exigences transversales : performance, sécurité, RGPD, accessibilité, auditabilité.

## Exigences

| ID | Titre | Exigence | Type | Prio | Source | Vérification | Rationale |
|----|-------|----------|------|------|--------|-------------|-----------|
| REQ-NFR-001 | Performance — Temps de réponse | Le temps de réponse du système pour les opérations interactives (chargement de page, résultat de scan unitaire) DOIT être inférieur à 2 secondes au 95e percentile. | NF | P0 | UX standard | Test de performance (k6) | Un temps de réponse > 3s augmente le taux d'abandon de 50%. |
| REQ-NFR-002 | Performance — Scan batch | Le système DOIT être capable de scanner 100 publications en batch en moins de 5 minutes. | NF | P1 | Persona agence | Test de charge | Les agences ont besoin d'auditer rapidement un portefeuille. |
| REQ-NFR-003 | Disponibilité | Le système DOIT garantir une disponibilité de 99,5 % mesurée mensuellement (hors maintenance planifiée annoncée 48 h à l'avance). | NF | P0 | SLA standard SaaS B2B | Monitoring Uptime | Seuil minimal acceptable pour un outil critique business. |
| REQ-NFR-004 | Scalabilité | L'architecture DOIT supporter une montée en charge linéaire jusqu'à 10 000 utilisateurs actifs simultanés sans dégradation de performance au-delà de 20 %. | NF | P2 | Croissance | Test de charge (k6) | Anticipe la Phase 3/4 de la roadmap. |
| REQ-NFR-005 | Sécurité — Authentification | Le système DOIT implémenter une authentification multi-facteur (MFA) optionnelle et le chiffrement des sessions via TLS 1.3. | NF | P0 | Sécurité standard | Audit sécurité | Protection des données sensibles (contrats, données créateurs). |
| REQ-NFR-006 | Sécurité — Chiffrement données | Les données sensibles (contrats, tokens OAuth, données personnelles) DOIVENT être chiffrées au repos (AES-256) et en transit (TLS 1.3). | NF | P0 | RGPD + sécurité | Audit sécurité | Obligation réglementaire et best practice. |
| REQ-NFR-007 | RGPD — Hébergement | L'ensemble des données personnelles et des contrats DOIT être hébergé dans l'Union Européenne (région France privilégiée). | C | P0 | RGPD | Vérification infra | Conformité RGPD pour le traitement de données de citoyens européens. |
| REQ-NFR-008 | RGPD — Droit à l'effacement | Le système DOIT permettre la suppression complète des données d'un utilisateur sur demande, dans un délai de 30 jours, conformément à l'article 17 du RGPD. | C | P0 | RGPD art.17 | Test d'effacement | Obligation légale. |
| REQ-NFR-009 | RGPD — Export données | Le système DOIT permettre à tout utilisateur d'exporter l'intégralité de ses données dans un format structuré et lisible par machine (JSON ou CSV). | C | P0 | RGPD art.20 | Test d'export | Droit à la portabilité des données. |
| REQ-NFR-010 | Accessibilité | L'interface utilisateur DEVRAIT être conforme au niveau AA des WCAG 2.1. | NF | P1 | RGAA | Audit WCAG | Obligation légale pour les services numériques en France. |
| REQ-NFR-011 | Internationalisation | Le système DOIT supporter le français comme langue primaire et DEVRAIT prévoir l'architecture pour l'ajout de l'anglais, l'allemand et l'espagnol (Phase 4). | NF | P1 | Roadmap expansion EU | Test i18n | Anticipe l'expansion européenne. |
| REQ-NFR-012 | Multi-tenancy | Le système DOIT garantir l'isolation stricte des données entre organisations (agences, marques, créateurs indépendants). | NF | P0 | Sécurité B2B | Test d'isolation | Impératif pour un SaaS multi-clients. |
| REQ-NFR-013 | Auditabilité | Le système DOIT journaliser toutes les actions critiques (création/modification de contrat, scan, modification de score, connexion) dans un journal d'audit immuable. | NF | P0 | Compliance | Test journal d'audit | Traçabilité nécessaire pour la conformité et le support. |
