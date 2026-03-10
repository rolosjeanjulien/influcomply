# Exigences — Certification & Badge (CRT)

> Matérialisation de la conformité sous forme d'un actif vérifiable par les tiers.

## Exigences

| ID | Titre | Exigence | Type | Prio | Source | Vérification | Rationale |
|----|-------|----------|------|------|--------|-------------|-----------|
| REQ-CRT-001 | Badge de certification | Le système DOIT attribuer un badge « InfluComply Certified » aux créateurs ayant maintenu un score de conformité supérieur ou égal à 80/100 sur les 90 derniers jours consécutifs. | F | P1 | PRD §4.5 | Test règle d'attribution | Incitation à maintenir la conformité dans la durée. |
| REQ-CRT-002 | API de vérification publique | Le système DOIT exposer une API REST publique permettant à un tiers (annonceur, agence) de vérifier le statut de certification d'un créateur à partir de son identifiant public. | I | P1 | PRD §4.5 | Test API + documentation | Permet l'intégration dans les workflows d'achat des annonceurs. |
| REQ-CRT-003 | Annuaire créateurs certifiés | Le système DEVRAIT proposer un annuaire public en ligne des créateurs certifiés, consultable par les marques, avec filtres par plateforme, thématique et audience. | F | P2 | PRD §4.5 | Test fonctionnel | Canal d'acquisition B2B et preuve de valeur pour les créateurs. |
| REQ-CRT-004 | Révocation automatique | Le système DOIT révoquer automatiquement le badge de certification lorsque le score de conformité descend en dessous de 70/100 sur une période glissante de 30 jours. | F | P1 | Crédibilité du badge | Test automatisé | Garantit la valeur du badge dans le temps. |
