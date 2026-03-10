# InfluComply — Instructions pour Claude Code

## Contexte
InfluComply est une plateforme SaaS B2B de conformité réglementaire
pour l'influence commerciale en France (loi n° 2023-451 du 9 juin 2023).

## Stack technique
- Framework: Next.js 15 (App Router) + TypeScript
- BDD: Supabase (PostgreSQL 16 + Auth + Storage + Realtime)
- ORM: Prisma
- UI: shadcn/ui + Tailwind CSS
- IA: Anthropic Claude API (classification, RAG)
- Jobs async: Trigger.dev
- Signature: Yousign API v3
- Email: Resend + React Email
- Déploiement: Vercel + Supabase Cloud (EU)

## Documentation de référence
- Exigences produit: docs/requirements/REQ-*.md
- Spécifications techniques: docs/specs/SPC-*.md
- Matrice de traçabilité: docs/traceability.md

## Conventions de développement
- Chaque feature DOIT référencer son ID d'exigence (REQ-XXX-NNN)
  et sa spec (SPC-XXX-NNN) en commentaire dans le code
- Langue du code: anglais (variables, fonctions, commentaires techniques)
- Langue des contenus utilisateur: français
- Validation des inputs: Zod (schémas partagés front/back)
- Tests: Vitest (unit) + Playwright (e2e)
- Chaque PR doit couvrir au minimum les critères d'acceptation
  de la spec associée

## Structure du code
src/
  app/           → Pages et routes Next.js (App Router)
  components/    → Composants React réutilisables
  lib/           → Utilitaires, clients API, helpers
  services/      → Logique métier (scanner, contrats, scoring)
  prisma/        → Schéma Prisma et migrations
  trigger/       → Jobs Trigger.dev

## Priorités de développement
Phase MVP (P0): REQ-SCN-001→009, REQ-CTR-001→003,008→010,
                REQ-DSH-001,003,005, REQ-REG-001,005,
                REQ-NFR-001,003,005→009,012,013
