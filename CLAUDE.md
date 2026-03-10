# CLAUDE.md — Conventions du projet

Ce fichier définit les conventions et directives pour Claude Code sur ce projet.

## Stack technique

- **Framework** : Next.js (App Router, React Server Components)
- **Langage** : TypeScript (strict)
- **Style** : Tailwind CSS v4
- **Composants UI** : shadcn/ui
- **Base de données** : PostgreSQL via Supabase
- **ORM** : Prisma

## Structure du projet

```
src/
  app/                  # Routes Next.js (App Router)
    (auth)/             # Groupe de routes authentifiées
    api/                # Route Handlers API
  components/
    ui/                 # Composants shadcn/ui (ne pas modifier)
    [feature]/          # Composants par fonctionnalité
  lib/
    prisma.ts           # Singleton Prisma Client
    supabase/
      client.ts         # Client Supabase (navigateur)
      server.ts         # Client Supabase (serveur, service role)
    utils.ts            # Utilitaires (cn, etc.)
  hooks/                # Custom React hooks
  types/                # Types TypeScript partagés
  generated/
    prisma/             # Client Prisma généré (ne pas committer)
prisma/
  schema.prisma         # Schéma de la base de données
  migrations/           # Migrations Prisma
```

## Conventions de code

### TypeScript
- Toujours utiliser TypeScript strict
- Préférer les `interface` aux `type` pour les objets
- Exporter les types depuis `src/types/`
- Pas de `any` — utiliser `unknown` si nécessaire

### Composants React
- Server Components par défaut (pas de `"use client"` sauf si nécessaire)
- Ajouter `"use client"` uniquement pour les composants interactifs
- Nommer les composants en PascalCase
- Un composant par fichier

### Fichiers et dossiers
- Kebab-case pour les noms de fichiers : `user-profile.tsx`
- PascalCase pour les composants : `UserProfile`
- camelCase pour les fonctions utilitaires

### Base de données (Prisma v7)
- Toujours utiliser le singleton `prisma` depuis `@/lib/prisma`
- Les URLs de connexion sont dans `prisma.config.ts` (pas dans `schema.prisma`)
  - `DATABASE_URL` → pooler Supabase (Transaction mode, port 6543) — runtime
  - `DIRECT_URL` → connexion directe Supabase (port 5432) — migrations
- Modèles en PascalCase : `User`, `Post`
- Tables en snake_case via `@@map("table_name")`
- Champs en camelCase dans le schéma, snake_case en DB via `@map`
- Toujours inclure `createdAt` et `updatedAt` sur les modèles

### API Routes
- Utiliser les Route Handlers Next.js dans `app/api/`
- Valider les entrées avec zod
- Retourner des réponses `NextResponse.json()`
- Gérer les erreurs avec des codes HTTP appropriés

### Styles
- Utiliser les classes Tailwind en priorité
- Variables CSS shadcn/ui pour les couleurs (ne pas hardcoder)
- Utiliser `cn()` de `@/lib/utils` pour les classes conditionnelles

## Commandes utiles

```bash
# Développement
npm run dev

# Build
npm run build

# Linting
npm run lint

# Prisma - générer le client
npx prisma generate

# Prisma - créer une migration
npx prisma migrate dev --name [nom-migration]

# Prisma - appliquer les migrations en production
npx prisma migrate deploy

# Prisma - ouvrir Prisma Studio
npx prisma studio
```

## Variables d'environnement

Voir `.env.example` pour toutes les variables requises.

- Ne jamais committer `.env` (contient les secrets)
- Committer `.env.example` avec des valeurs placeholder
- Les variables `NEXT_PUBLIC_*` sont exposées côté client

## Supabase

- Utiliser `createSupabaseClient()` depuis `@/lib/supabase/client` pour le navigateur
- Utiliser `createSupabaseServerClient()` depuis `@/lib/supabase/server` pour les Server Components et API Routes
- Prisma est la source principale pour les requêtes DB
- Supabase est utilisé pour l'auth, storage, et realtime si nécessaire
