# Exigences — Regulatory Intelligence (REG)

> Moteur de veille réglementaire garantissant que la plateforme reste à jour face aux évolutions législatives.

## Exigences

| ID | Titre | Exigence | Type | Prio | Source | Vérification | Rationale |
|----|-------|----------|------|------|--------|-------------|-----------|
| REQ-REG-001 | Base de connaissances juridique | Le système DOIT maintenir une base de connaissances structurée contenant : les textes de loi, décrets d'application, ordonnances, positions DGCCRF, certificat ARPP, guides de bonne conduite, indexés et vectorisés pour la recherche sémantique. | F | P0 | PRD §4.4 | Audit de complétude | Fondation du moteur de conformité et du chatbot. |
| REQ-REG-002 | Alertes évolutions réglementaires | Le système DOIT notifier les utilisateurs dans un délai de 48 h lorsqu'un nouveau texte impactant l'influence commerciale est publié au Journal Officiel ou émis par la DGCCRF. | F | P1 | PRD §4.4 | Test de veille | La loi évolue (ordonnance 2024, décret 2026) ; les utilisateurs doivent être informés. |
| REQ-REG-003 | Chatbot réglementaire | Le système DEVRAIT fournir un assistant conversationnel spécialisé capable de répondre aux questions juridiques courantes en citant ses sources, utilisant une architecture RAG (Retrieval-Augmented Generation). | F | P1 | PRD §4.4 | Test qualitatif + benchmark | Réduit le besoin de conseil juridique pour les questions simples. |
| REQ-REG-004 | Citation systématique des sources | Toute réponse du chatbot réglementaire DOIT citer la ou les sources juridiques utilisées (article de loi, décret, guide) avec lien vers le texte original. | C | P0 | Gestion du risque | Test automatisé RAG | Prévient les hallucinations et renforce la confiance. |
| REQ-REG-005 | Mise à jour moteur de règles | Le système DOIT permettre la mise à jour du moteur de règles de conformité (critères de scan) dans un délai de 5 jours ouvrés après la publication d'un nouveau texte réglementaire. | NF | P0 | Maintenance | SLA interne | Garantit que les scans restent pertinents face aux évolutions. |
