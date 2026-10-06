# CLAUDE.md

Guide de travail pour Claude Code et les développeurs de Hacka Monster. Le contexte fonctionnel, le périmètre du MVP et le modèle de données sont dans @README.md.

## Contexte et priorités

Outil interne de création de posts LinkedIn assisté par IA, livré en **6h** pendant un hackathon, par une équipe de 3 à 4 personnes travaillant en parallèle.

Ordre de priorité pour toute décision :
1. Le parcours de démo fonctionne de bout en bout (type → questions → paramètres → génération → ajustement → validation).
2. L'interface est propre et fidèle au design.
3. Le reste (vue relecteur, calendrier, finitions).

Conséquences :
- Faire la solution la plus simple qui marche. Pas d'abstraction « pour plus tard », pas de généralisation prématurée.
- Ne pas ajouter de fonctionnalité hors du périmètre MVP du README sans demande explicite.
- Ne pas refactorer du code qui n'est pas dans le périmètre de la tâche en cours : d'autres personnes travaillent dessus en même temps.

## Stack

- Next.js (App Router) + TypeScript strict
- Tailwind CSS + shadcn/ui
- Supabase (Postgres, Auth, RLS) via `@supabase/ssr`
- Vercel AI SDK (`ai`) + OpenRouter (`@openrouter/ai-sdk-provider`)
- Validation : `zod`
- Déploiement : Vercel (chaque push sur `main` est déployé)

N'ajoute aucune dépendance (librairie UI, ORM, state manager, client HTTP...) sans accord de l'équipe. Avant d'en proposer une, vérifie que la stack ne couvre pas déjà le besoin.

## Commandes

```bash
npm run dev                         # serveur local sur http://localhost:3000
npm run lint                        # ESLint
npx tsc --noEmit                    # vérification des types
npm run build                       # build de production (comme sur Vercel)
npx shadcn@latest add <composant>   # ajouter un composant shadcn/ui
npx supabase db reset               # (Supabase local) migrations + seed
npx supabase gen types typescript --local > lib/supabase/database.types.ts
```

## Structure cible

```
app/
  (auth)/login/            connexion
  posts/                   historique de l'utilisateur
  posts/new/               parcours de création en étapes
  posts/[id]/              édition, aperçu, validation
  review/                  vue relecteur
  api/generate/route.ts    génération IA en streaming
components/
  ui/                      composants shadcn/ui (générés par le CLI)
  posts/                   composants métier (wizard, éditeur, aperçu LinkedIn...)
lib/
  ai/                      provider OpenRouter, prompts
  supabase/                clients serveur / navigateur, types générés
  post-types.ts            types de post et questions guidées
supabase/
  migrations/              migrations SQL
  seed.sql                 données de démo
```

Respecte cette organisation. Si un fichier n'a pas sa place, demande avant de créer un nouveau dossier racine.

## UI : shadcn/ui obligatoire

Le design est réalisé avec les composants [shadcn/ui](https://ui.shadcn.com). Le code doit le reproduire avec ces mêmes composants.

- **Toujours partir d'un composant shadcn/ui.** Consulte le catalogue (https://ui.shadcn.com/docs/components) avant de créer un élément d'interface.
- **Installer via le CLI** (`npx shadcn@latest add`), jamais par copier-coller depuis le site.
- **Ne pas modifier `components/ui/`** pour un besoin ponctuel : composer ou envelopper dans `components/posts/`, utiliser `className` et les variantes.
- **Aucune autre librairie de composants** (MUI, Chakra, Ant Design, Headless UI...).
- **Thème uniquement** : couleurs, rayons et typographie via les variables CSS de `app/globals.css` et les classes sémantiques (`bg-primary`, `text-muted-foreground`, `border`...). Pas de couleur codée en dur, sauf dans l'aperçu LinkedIn qui imite l'interface de LinkedIn.
- **Icônes** : `lucide-react` uniquement.
- **Fidélité à la maquette** : hiérarchie, espacements, composants choisis. Si un élément n'a pas d'équivalent shadcn, compose-le avec des composants existants et signale-le.
- Gère systématiquement les états **chargement** (`Skeleton`, bouton désactivé), **vide** et **erreur** (`Sonner`).

| Besoin | Composants shadcn/ui |
|---|---|
| Parcours en étapes | `Card`, `Button`, `Progress` ou `Tabs` |
| Choix du type de post | `RadioGroup` ou `ToggleGroup`, `Card` |
| Questions guidées | `Form`, `Label`, `Textarea`, `Input` |
| Paramètres de rédaction | `Select`, `Slider`, `Switch` |
| Éditeur et aperçu | `Textarea`, `Card`, `Avatar`, `Separator` |
| Statuts | `Badge` |
| Historique, vue relecteur | `Table`, `Tabs`, `DropdownMenu` |
| Date de diffusion | `Calendar`, `Popover` |
| Confirmations et retours | `Dialog`, `AlertDialog`, `Sonner` |

## Next.js

- **Server Components par défaut.** `"use client"` seulement pour l'état local, les événements ou les hooks, et le plus bas possible dans l'arbre.
- **Mutations via Server Actions** (création, mise à jour, changement de statut), suivies de `revalidatePath`.
- **Route Handler uniquement pour le streaming IA** (`app/api/generate/route.ts`), consommé côté client avec les hooks du AI SDK.
- **Valider toute entrée avec `zod`** côté serveur (Server Actions et Route Handlers), même si le formulaire valide déjà.
- Pas de `fetch` vers ses propres routes API depuis un Server Component : appeler directement la fonction serveur.

## IA (AI SDK + OpenRouter)

- **Appels uniquement côté serveur.** `OPENROUTER_API_KEY` ne doit jamais être préfixée `NEXT_PUBLIC_` ni importée dans un composant client.
- Le modèle est lu dans `OPENROUTER_MODEL`, **jamais codé en dur** : les modèles gratuits peuvent être saturés et doivent pouvoir changer sans modifier le code.
- Un seul point d'entrée pour le provider (`lib/ai/`). Les prompts vivent dans `lib/ai/prompts.ts`, pas dans les composants ni les routes.
- Prompt système = rôle de community manager + **ligne éditoriale lue en base** + règles LinkedIn (accroche, paragraphes courts, appel à l'action). Le prompt utilisateur assemble type de post, réponses et paramètres.
- Utiliser `streamText` pour la génération (le texte s'affiche au fil de l'eau). Une variante = même contexte + consigne d'angle différent + texte actuel éventuellement édité.
- Gérer les erreurs du fournisseur (quota, 429, timeout) avec un message clair à l'utilisateur, sans planter la page.
- Ne jamais envoyer de données réelles ou sensibles : données fictives uniquement (modèles gratuits).

## Supabase

- Clients via `@supabase/ssr` : `lib/supabase/server.ts` pour le serveur, `lib/supabase/client.ts` pour le navigateur. Ne pas en créer d'autres.
- **La sécurité repose sur le RLS**, pas sur le front. Toute nouvelle table a le RLS activé et des policies explicites.
- `service_role` interdite dans le code applicatif.
- **Schéma modifié uniquement par migration** dans `supabase/migrations/`, par une seule personne désignée. Ne jamais modifier le schéma depuis le Studio sans migration.
- Après une migration, régénérer les types (`supabase gen types`) et les utiliser : pas de types de table écrits à la main.
- Noms de tables, colonnes et valeurs de statut : exactement ceux du README (`brouillon`, `en_relecture`, `valide`, `publie`).

## Code

- TypeScript strict : pas de `any`, pas de `@ts-ignore`. Préférer les types inférés (zod, types Supabase générés).
- Identifiants (variables, fonctions, fichiers) en anglais ; textes de l'interface en français.
- Fichiers en `kebab-case`, composants en `PascalCase`.
- Un composant = une responsabilité. Au-delà d'environ 200 lignes, découper.
- Types de post et questions guidées dans `lib/post-types.ts`, pas en base ni éparpillés dans les composants.
- Commentaires seulement quand le « pourquoi » n'est pas évident.
- Pas de `console.log` laissé dans le code commité.

## Git

- Une branche courte par tâche (`feat/wizard`, `feat/generate`...), merge fréquent sur `main`.
- Petits commits ciblés, messages au format `type: description` (`feat`, `fix`, `docs`, `chore`).
- `main` doit toujours builder : c'est ce qui est déployé pour la démo.
- Ne jamais commiter `.env.local` ni aucune clé. Toute nouvelle variable est ajoutée à `.env.example` et au README.

## Avant de dire qu'une tâche est terminée

1. `npm run lint` et `npx tsc --noEmit` passent sans erreur.
2. `npm run build` passe si la tâche touche à la config, aux routes ou aux dépendances.
3. Le parcours concerné a été testé dans le navigateur, y compris les états chargement et erreur.
4. Aucune clé, donnée réelle ni `console.log` dans le diff.

## À ne pas faire

- Publier réellement sur LinkedIn : hors MVP, le bouton « Publier » change seulement le statut et copie le texte.
- Mettre les questions guidées ou les types de post en base.
- Contourner le RLS ou utiliser `service_role`.
- Ajouter des tests automatisés lourds : sur 6h, on vérifie manuellement le parcours de démo.
- Modifier des fichiers d'une autre piste sans prévenir l'équipe.
