# Exigences — Interfaces (INT)

> Points d'intégration avec les systèmes externes.

## Exigences

| ID | Titre | Exigence | Type | Prio | Source | Vérification | Rationale |
|----|-------|----------|------|------|--------|-------------|-----------|
| REQ-INT-001 | API REST publique | Le système DOIT exposer une API REST documentée (OpenAPI 3.0) permettant aux partenaires (plateformes de marketing d'influence, agences) d'intégrer les fonctionnalités de conformité en marque blanche. | I | P1 | Stratégie API/marque blanche | Test API + doc Swagger | Canal de distribution B2B et moat stratégique. |
| REQ-INT-002 | Webhooks | Le système DOIT fournir des webhooks configurables pour notifier les systèmes tiers des événements clés : nouveau scan, alerte non-conformité, contrat signé, changement de score. | I | P1 | Intégrabilité | Test webhooks | Permet l'intégration dans les workflows existants des agences. |
| REQ-INT-003 | Intégration Yousign | Le système DEVRAIT s'intégrer avec l'API Yousign pour la signature électronique des contrats, avec support de la signature avancée eIDAS. | I | P1 | PRD §4.2 | Test d'intégration | Solution française, conforme eIDAS. |
| REQ-INT-004 | Intégration API Sirene | Le système POURRAIT s'intégrer avec l'API Sirene de l'INSEE pour la vérification automatique des numéros SIRET des partenaires contractuels. | I | P2 | PRD §4.2 | Test d'intégration | Vérification de l'identité juridique des contreparties. |
| REQ-INT-005 | SSO entreprise | Le système DEVRAIT supporter le Single Sign-On via SAML 2.0 ou OIDC pour les clients Enterprise. | I | P2 | Persona Enterprise | Test SSO | Exigence classique des grands comptes / annonceurs. |
