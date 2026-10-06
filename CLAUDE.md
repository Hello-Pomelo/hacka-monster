# CLAUDE.md

Instructions pour Claude Code et les développeurs du projet Hacka Monster. Le contexte fonctionnel, la stack et le modèle de données sont dans [README.md](README.md). Le besoin fait foi dans [docs/cahier-des-charges.md](docs/cahier-des-charges.md) : le lire avant toute fonctionnalité et citer la référence (F1 à F7) concernée.

## Projet

Outil interne de création de posts LinkedIn assisté par IA, à livrer en 6h (hackathon). Priorité : un parcours de démo qui fonctionne de bout en bout, plutôt que des fonctionnalités en plus.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres, Auth, RLS)
- Vercel AI SDK (`ai`) + OpenRouter (`@openrouter/ai-sdk-provider`), modèle lu dans `OPENROUTER_MODEL`
- Déploiement Vercel

Ne pas ajouter d'autre framework, librairie UI ou ORM sans accord de l'équipe.

## UI : shadcn/ui obligatoire

Le design est conçu avec les composants [shadcn/ui](https://ui.shadcn.com). Le code doit le reproduire avec ces mêmes composants.

- **Toujours partir d'un composant shadcn/ui.** Avant de créer un élément d'interface, vérifier s'il existe dans le catalogue (https://ui.shadcn.com/docs/components) et l'utiliser.
- **Installer les composants avec le CLI** : `npx shadcn@latest add <composant>`. Ils arrivent dans `components/ui/`. Ne jamais les recopier à la main depuis le site.
- **Ne pas modifier `components/ui/`** pour un besoin ponctuel. Composer ou envelopper le composant dans `components/` (par exemple `components/post-preview.tsx`), et passer des `className` ou des variantes.
- **Aucune autre librairie de composants** (MUI, Chakra, Ant Design, Headless UI, etc.).
- **Couleurs, rayons et typographie via le thème** : variables CSS de `app/globals.css` et classes sémantiques (`bg-primary`, `text-muted-foreground`, `border`...). Pas de couleur codée en dur (`bg-[#0a66c2]`, `text-blue-600`), sauf pour l'aperçu LinkedIn qui imite l'interface de LinkedIn.
- **Icônes** : `lucide-react` (fourni avec shadcn/ui).
- **Suivre la maquette** : respecter la hiérarchie, les espacements et les composants choisis par le design. Si un élément de la maquette n'a pas d'équivalent shadcn, le composer à partir de composants existants et le signaler à l'équipe.

Correspondance indicative avec les écrans du projet :

| Besoin | Composants shadcn/ui |
|---|---|
| Parcours en étapes | `Card`, `Button`, `Progress` ou `Tabs` |
| Choix du type de post | `RadioGroup` ou `ToggleGroup`, `Card` |
| Questions guidées | `Form`, `Label`, `Textarea`, `Input` |
| Paramètres de rédaction | `Select`, `Slider`, `Switch` |
| Éditeur et aperçu | `Textarea`, `Card`, `Avatar`, `Separator` |
| Statuts | `Badge` |
| Historique, vue relecteur | `Table`, `Tabs`, `DropdownMenu` |
| Date de diffusion | `Calendar`, `Popover` (date picker) |
| Confirmations et retours | `Dialog`, `AlertDialog`, `Sonner` (toasts) |
| Chargement de la génération | `Skeleton` |

## Conventions de code

- Composants serveur par défaut, `"use client"` uniquement quand c'est nécessaire (état, événements).
- Appels à OpenRouter uniquement côté serveur (Route Handler ou Server Action). La clé ne doit jamais atteindre le navigateur.
- Accès Supabase via les clients `@supabase/ssr` (serveur et navigateur). Les droits sont garantis par les règles RLS, pas seulement par le front.
- Toute modification de schéma passe par une migration dans `supabase/migrations`. Une seule personne modifie le schéma.
- Questions guidées et types de post définis dans un fichier de configuration, pas en base.
- Textes de l'interface en français.
- Données fictives uniquement : rien de réel ni de sensible n'est envoyé aux modèles gratuits.
