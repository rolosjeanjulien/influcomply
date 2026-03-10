// Génération de contrats à partir de templates
// SPC-CTR-001 — templates Handlebars avec clauses obligatoires
// SPC-CTR-009 — disclaimer légal non supprimable

import type { CollaborationType, ContractWizardData } from "@/types/contract"

// ─────────────────────────────────────────────
// Clauses obligatoires — loi 2023-451
// ─────────────────────────────────────────────

const MANDATORY_DISCLOSURE_CLAUSE = `
**ARTICLE — OBLIGATION DE DIVULGATION (Loi 2023-451, art. 5)**

Le Créateur s'engage à identifier clairement et visiblement tout contenu publié dans le cadre de la présente collaboration comme étant une communication commerciale, en apposant la mention « Publicité » ou « Collaboration commerciale » de façon lisible et en début de contenu, conformément à l'article 5 de la loi n° 2023-451 du 9 juin 2023 relative à l'influence commerciale.
`

const JOINT_LIABILITY_CLAUSE = `
**ARTICLE — RESPONSABILITÉ SOLIDAIRE (Loi 2023-451, art. 7)**

Conformément à l'article 7 de la loi n° 2023-451 du 9 juin 2023, l'Annonceur et le Créateur sont solidairement responsables des dommages causés aux tiers résultant du contenu publié dans le cadre de cette collaboration commerciale, dans les conditions prévues par ladite loi.
`

const PROHIBITED_PRODUCTS_CLAUSE = `
**ARTICLE — PRODUITS ET SERVICES INTERDITS (Loi 2023-451, art. 3)**

Le Créateur s'engage à ne promouvoir aucun produit ou service dont la promotion est interdite aux influenceurs en vertu de l'article 3 de la loi n° 2023-451, notamment : les actes de chirurgie esthétique, les produits à base de nicotine, les jeux d'argent non agréés, et tout produit ou service interdit par la réglementation en vigueur.
`

const LEGAL_DISCLAIMER = `
---
**AVERTISSEMENT LÉGAL IMPORTANT**

Ce contrat a été généré automatiquement par InfluComply à titre d'assistance et de modèle de départ. Il ne constitue pas un conseil juridique et ne se substitue pas à la consultation d'un juriste ou avocat spécialisé en droit de la communication commerciale. Les parties sont invitées à faire relire ce document par un professionnel du droit avant sa signature.

Conforme à la loi n° 2023-451 du 9 juin 2023 relative à l'influence commerciale et aux décrets d'application.
`

// ─────────────────────────────────────────────
// Templates par type de collaboration
// SPC-CTR-001
// ─────────────────────────────────────────────

function formatDate(d?: Date): string {
  if (!d) return "À définir"
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatAmount(amount?: number, currency = "EUR"): string {
  if (!amount) return "Aucune rémunération monétaire"
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amount)
}

function buildBaseContract(data: ContractWizardData, title: string): string {
  const generatedAt = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return `# ${title}

**Généré le :** ${generatedAt}
**Référence :** IC-${Date.now()}

---

## ENTRE LES PARTIES

**LE CRÉATEUR**
Nom : ${data.creatorName}
Email : ${data.creatorEmail}
Ci-après désigné « le Créateur »

**LA MARQUE / L'ANNONCEUR**
Raison sociale : ${data.brandName}
Email : ${data.brandEmail}
${data.brandSiret ? `SIRET : ${data.brandSiret}` : ""}
Ci-après désigné « l'Annonceur »

---

## OBJET DU CONTRAT

${buildObjectClause(data)}

---

## DURÉE ET CALENDRIER

- **Date de début :** ${formatDate(data.startDate)}
- **Date de fin :** ${formatDate(data.endDate)}

---

## LIVRABLES ET OBLIGATIONS

${data.deliverables || "Les livrables seront définis d'un commun accord entre les parties avant le début de la collaboration."}

---

## RÉMUNÉRATION

**Montant :** ${formatAmount(data.amount, data.currency)}

${data.type === "GIFTING" ? `Les produits ou services fournis par l'Annonceur au Créateur dans le cadre de cette collaboration constituent un avantage en nature dont la valeur doit être prise en compte dans le calcul du seuil de ${new Date().getFullYear()} au sens de la loi 2023-451.` : ""}

---
${MANDATORY_DISCLOSURE_CLAUSE}
---
${data.hasJointLiabilityClause ? JOINT_LIABILITY_CLAUSE + "\n---\n" : ""}
${PROHIBITED_PRODUCTS_CLAUSE}
---

## PROPRIÉTÉ INTELLECTUELLE
${
  data.hasIpClause
    ? `
Le Créateur conserve la propriété intellectuelle de ses créations. L'Annonceur bénéficie d'une licence d'utilisation non exclusive, limitée à la promotion de la collaboration sur ses propres canaux de communication, pour une durée de 12 mois à compter de la publication.
`
    : `
Les droits de propriété intellectuelle feront l'objet d'un accord séparé entre les parties.
`
}

---

## EXCLUSIVITÉ
${
  data.hasExclusivityClause && data.exclusivityMonths
    ? `Le Créateur s'engage à ne pas collaborer avec des marques concurrentes directes de l'Annonceur pendant une durée de **${data.exclusivityMonths} mois** à compter de la date de début du contrat.`
    : "Aucune clause d'exclusivité n'est stipulée dans le cadre de cette collaboration."
}

---

## RÉSILIATION

Chaque partie peut résilier le présent contrat avec un préavis de 30 jours, par notification écrite. En cas de manquement grave aux obligations légales (notamment loi 2023-451), la résiliation peut être immédiate.

---

## DROIT APPLICABLE ET JURIDICTION

Le présent contrat est soumis au droit français. Tout litige sera soumis aux tribunaux compétents du ressort de Paris.

---

## SIGNATURES

**Pour le Créateur :**
Nom : ${data.creatorName}
Date : _______________
Signature : _______________

**Pour l'Annonceur :**
Nom : ${data.brandName}
Date : _______________
Signature : _______________

---
${LEGAL_DISCLAIMER}`
}

function buildObjectClause(data: ContractWizardData): string {
  const objects: Record<CollaborationType, string> = {
    GIFTING: `La présente convention définit les conditions dans lesquelles l'Annonceur fournit au Créateur des produits ou services à titre gratuit (gifting), en contrepartie d'une éventuelle publication sur les réseaux sociaux du Créateur. Conformément à la loi 2023-451, toute publication liée à ce gifting devra être clairement identifiée comme commerciale si le Créateur bénéficie d'un avantage matériel.`,
    PAID_PARTNERSHIP: `La présente convention de partenariat rémunéré définit les conditions dans lesquelles le Créateur réalise et publie des contenus sponsorisés pour le compte de l'Annonceur, en contrepartie d'une rémunération. Tout contenu publié dans ce cadre doit être clairement identifié comme publicité (loi 2023-451, art. 5).`,
    BRAND_AMBASSADOR: `La présente convention d'ambassadeur de marque définit les conditions dans lesquelles le Créateur représente la marque de l'Annonceur de manière continue, en créant et publiant des contenus valorisant les produits et services de l'Annonceur. Le Créateur s'engage à respecter les dispositions de la loi 2023-451 pour l'ensemble des contenus publiés dans ce cadre.`,
  }
  return objects[data.type]
}

// ─────────────────────────────────────────────
// Point d'entrée public
// ─────────────────────────────────────────────

const TITLES: Record<CollaborationType, string> = {
  GIFTING: "Convention de Don de Produits (Gifting)",
  PAID_PARTNERSHIP: "Contrat de Partenariat Rémunéré",
  BRAND_AMBASSADOR: "Contrat d'Ambassadeur de Marque",
}

export function generateContractContent(data: ContractWizardData): string {
  return buildBaseContract(data, TITLES[data.type])
}
