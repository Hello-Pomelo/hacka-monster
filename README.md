# Hacka Monster

Outil interne de création de posts LinkedIn assisté par IA, réalisé en 6h pendant le Hackathon IA 2026.

L'utilisateur paramètre un post, l'IA le rédige dans le ton de l'entreprise, l'utilisateur le relit, l'ajuste puis le valide. L'équipe marketing / communication relit les posts destinés à la page entreprise.

## Parcours principal

```
Choisir un type de post → Répondre aux questions → Régler les paramètres → Générer → Ajuster → Valider
                                                                              ↑          │
                                                                              └ régénérer┘
```

## Périmètre du MVP

- [ ] Création d'un post et choix de son type (marque employeur, projet livré, retour d'expérience technique, événement, arrivée d'un collaborateur)
- [ ] Questions guidées pour renseigner la matière du post (réponses en vrac acceptées)
- [ ] Paramètres de rédaction : ton, longueur, emojis, hashtags, appel à l'action
- [ ] Génération du post par l'IA, dans le respect de la ligne éditoriale
- [ ] Modification du texte et régénération d'une variante
- [ ] Aperçu du post au format LinkedIn
- [ ] Validation du post et suivi de son statut
- [ ] Historique des posts de l'utilisateur
- [ ] Vue relecteur : posts en préparation, auteurs, statuts

Hors MVP : la publication réelle sur LinkedIn (l'API demande une validation d'application). Le bouton « Publier » passe le post au statut `publié` et copie le texte. La programmation se limite à une date de diffusion.

## Stack technique

| Couche | Choix | Rôle |
|---|---|---|
| Framework | [Next.js](https://nextjs.org) (App Router) + TypeScript | Front et back dans un seul projet, Server Actions et Route Handlers |
| UI | [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) | Formulaire multi-étapes, éditeur, badges de statut, calendrier |
| Base de données et auth | [Supabase](https://supabase.com) (Postgres, Auth, RLS) | Comptes, rôles auteur / relecteur, posts, historique |
| IA (SDK) | [Vercel AI SDK](https://ai-sdk.dev) (`ai`) | Appels LLM et streaming de la génération |
| IA (modèles) | [OpenRouter](https://openrouter.ai) via `@openrouter/ai-sdk-provider` | Accès aux modèles, dont des modèles gratuits (`:free`) |
| Hébergement | [Vercel](https://vercel.com) | Déploiement automatique à chaque push sur `main` |
| Outillage | Claude Code + `CLAUDE.md` | Génération de code cohérente pour toute l'équipe |

Le modèle est choisi par variable d'environnement (`OPENROUTER_MODEL`) : on peut en changer sans toucher au code si un modèle gratuit est saturé.

## Architecture

```
Navigateur ──► Next.js (Vercel) ──► Supabase (Postgres + Auth)
                     │
                     └──► OpenRouter ──► LLM
```

- La clé OpenRouter reste côté serveur (Route Handler ou Server Action), jamais dans le navigateur.
- La ligne éditoriale est injectée dans le prompt système à chaque génération.
- Les questions guidées sont définies en dur par type de post dans un fichier de configuration.

## Modèle de données

| Table | Champs principaux |
|---|---|
| `profiles` | `id` (lié à `auth.users`), `nom`, `role` (`auteur` \| `relecteur`) |
| `editorial_line` | Ligne unique : ton, valeurs, mots à éviter, exemples de posts |
| `posts` | `author_id`, `type`, `cible` (`perso` \| `entreprise`), `answers` (jsonb), `params` (jsonb), `content`, `status`, `scheduled_at`, `created_at`, `updated_at` |

Statuts d'un post : `brouillon` → `en_relecture` (cible `entreprise` uniquement) → `valide` → `publie`.

Règles RLS : un auteur lit et modifie ses propres posts tant qu'ils ne sont pas validés ; un relecteur lit tous les posts et change leur statut.

## Démarrage

### Prérequis

- Node.js 20+
- Un compte [OpenRouter](https://openrouter.ai) avec une clé API **par personne** (les quotas gratuits sont limités)
- L'accès au projet Supabase de l'équipe

### Installation

```bash
git clone https://github.com/Hello-Pomelo/hacka-monster.git
cd hacka-monster
npm install
cp .env.example .env.local   # puis renseigner les valeurs
npm run dev
```

L'application tourne sur http://localhost:3000.

### Variables d'environnement

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase |
| `OPENROUTER_API_KEY` | Clé API OpenRouter (serveur uniquement) |
| `OPENROUTER_MODEL` | Identifiant du modèle, par exemple un modèle `:free` |

### Supabase en local (optionnel)

Pour travailler sur une base isolée (Docker requis) :

```bash
npx supabase start      # lance Postgres, Auth et Studio en local
npx supabase db reset   # applique supabase/migrations puis supabase/seed.sql
```

Toute modification de schéma passe par une migration dans `supabase/migrations`. Une seule personne modifie le schéma. Le projet cloud utilisé par Vercel est mis à jour avec `npx supabase db push`.

## Organisation de l'équipe

| Piste | Contenu |
|---|---|
| Socle (tous, première heure) | Init du projet, Supabase, Vercel, `CLAUDE.md`, schéma, données de départ |
| A | Formulaire multi-étapes : type, questions guidées, paramètres |
| B | Génération IA : prompt système, ligne éditoriale, streaming, variantes |
| C | Éditeur, aperçu LinkedIn, validation et statuts |
| D | Historique, vue relecteur, calendrier de diffusion |
| Fin | Intégration, données de démo, répétition du scénario. Pas de nouvelle fonctionnalité après H5 |

## Conventions

- **Design et UI : uniquement des composants [shadcn/ui](https://ui.shadcn.com).** Le design est réalisé avec ces composants, le code les reprend à l'identique (installation via `npx shadcn@latest add <composant>`, aucune autre librairie UI, couleurs via le thème). Règles détaillées dans [CLAUDE.md](CLAUDE.md).
- Branches courtes par piste, merge fréquent sur `main` (déployé automatiquement).
- Aucune donnée réelle ou sensible envoyée aux modèles gratuits : données fictives uniquement.
- En cas de panne pendant la démo : `npm run dev` sur un portable connecté au Supabase cloud.
