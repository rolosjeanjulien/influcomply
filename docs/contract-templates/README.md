# Templates de contrats InfluComply

Ce dossier contient les modèles de contrats utilisés pour la génération automatique.

## Templates disponibles

| Fichier | Type | Usage |
|---|---|---|
| `gifting.md` | Gifting / Dotation | Produits remis gratuitement, valeur < 1000€ HT |
| `paid-partnership.md` | Partenariat rémunéré | Collaboration avec rémunération financière |
| `brand-ambassador.md` | Ambassadeur de marque | Partenariat long terme avec exclusivité |

## Variables disponibles

Les templates utilisent des variables `{{variable}}` remplacées par l'IA lors de la génération :

- `{{creatorName}}` — Nom du créateur
- `{{creatorEmail}}` — Email du créateur
- `{{brandName}}` — Nom de la marque/annonceur
- `{{brandEmail}}` — Email de la marque
- `{{brandSiret}}` — SIRET de la marque (optionnel)
- `{{brandRepresentative}}` — Représentant légal de la marque
- `{{amount}}` — Montant HT en euros
- `{{amountTTC}}` — Montant TTC
- `{{startDate}}` — Date de début
- `{{endDate}}` — Date de fin
- `{{deliverables}}` — Description des livrables
- `{{platforms}}` — Plateformes concernées
- `{{ipRights}}` — Cession de droits (booléen)
- `{{exclusivity}}` — Clause d'exclusivité (booléen)
- `{{exclusivityMonths}}` — Durée d'exclusivité en mois

## Ajouter un template

1. Créez un fichier `.md` dans ce dossier
2. Utilisez les variables `{{variable}}` pour les champs dynamiques
3. Incluez obligatoirement les clauses légales (Art. 3, 4, 5, 7 de la loi 2023-451)
