# Règles de design

Mise à jour : 2026-10-06 · Version : 1 · Maquette : [Hello Pomelo Posts](https://claude.ai/artifact/6rL8eHe8ej8x7a9a61Uq22), version `1791302762-f562`

## Source

La maquette évolue en continu et fait foi. Ce document en est la transcription à la version indiquée en tête. En cas d'écart, la maquette l'emporte : ce document et `app/globals.css` sont mis à jour, ainsi que la version en tête.

> **Remarque :** nous recommandons de relire la maquette avec l'outil Artifact (action « read ») avant tout travail d'interface, et de comparer sa version à celle de ce document.

## Principes

L'identité Hello Pomelo passe uniquement par les variables de `app/globals.css`. Les composants [shadcn/ui](https://ui.shadcn.com/docs/theming) restent tels que générés dans `components/ui/`, et les écrans les composent avec les classes sémantiques de [Tailwind](https://tailwindcss.com/docs/theme) (`bg-primary`, `text-muted-foreground`, `bg-warning-surface`…).

| Règle | Application |
|---|---|
| Thème | Clair uniquement. Aucune classe `dark:` ajoutée dans les écrans. |
| Surfaces | Fond de page gris (`bg-page`), cartes blanches (`bg-card`) sans ombre. |
| Ombre | Réservée aux éléments flottants : bouton « Créer un nouveau post », menus (`shadow-float`). |
| Accent | Une seule couleur d'accent, le rose `primary` : action principale, focus, onglet actif, jour courant. |
| Couleurs | Aucune valeur codée en dur, sauf dans l'aperçu LinkedIn. |
| Icônes | [lucide-react](https://lucide.dev/icons/), 16 px dans le texte, 18 px dans la navigation. |
| Langue | Interface en français, lecteur vouvoyé. Dates au format `fr-FR`, heures en « 8 h 30 ». |

## Couleurs

| Token | Valeur | Usage |
|---|---|---|
| `primary` | `#D9306B` | Bouton principal, focus (`ring`), onglet actif |
| `primary-hover` | `#A62351` | Survol du bouton principal |
| `foreground` | `#111821` | Texte courant |
| `muted-foreground` | `#111821` à 80 % | Texte secondaire |
| `subtle-foreground` | `#111821` à 60 % | Libellés, dates, aides de saisie |
| `link` | `#A62351` | Liens texte |
| `background`, `card`, `popover` | `#FFFFFF` | Contrôles, cartes, menus |
| `page`, `secondary`, `muted` | `#F8F7F6` | Fond de page, bouton secondaire |
| `secondary-hover` | `#EFEDEB` | Survol du bouton secondaire |
| `accent` | `#111821` à 5 % | Survol des éléments neutres |
| `border` | `#CDCDCD` | Séparateurs, grille du calendrier |
| `input` | `#949492` | Bordure des champs |
| `destructive` | `#CC0000` | Erreurs, suppression |
| `success`, `success-surface` | `#3D7A00`, `#F7FCF2` | Statut publié |
| `warning`, `warning-surface` | `#996800`, `#FFF4DC` | Statut en relecture, objectif non atteint |
| `chip`, `chip-foreground` | `#111821` à 10 %, à 80 % | Pastilles neutres, compteurs, statut validé |
| `tag`, `tag-foreground`, `tag-border` | `#FFF8FA`, `#A62351`, `#D9306B` à 50 % | Suggestions de l'assistant |
| `sidebar` | `#111821` | Barre latérale, texte blanc |
| `sidebar-accent` | blanc à 10 % | Élément de navigation actif ou survolé |

## Typographie

| Usage | Police | Réglage |
|---|---|---|
| Texte | Fustat, chargée par [`next/font`](https://nextjs.org/docs/app/api-reference/components/font) | 14 px, interligne 1,4 |
| Titres `h1` à `h3` (`font-heading`) | Archia, sinon Helvetica Neue, Arial | Graisse 500, interlettrage −0,04 em, interligne 1,05 |
| Titre de page | `font-heading` | 32 px (26 px sous 560 px de large) |
| Chiffres clés | `font-heading` | 24 px, chiffres tabulaires |
| Libellés et badges | Fustat | 11 à 12 px, majuscules, interlettrage 0,05 à 0,06 em |

## Formes et dimensions

| Élément | Valeur | Classe |
|---|---|---|
| Contrôles : boutons, champs, sélecteurs | Rayon 4 px | `rounded-lg` (composants shadcn) |
| Badges | Rayon 4 px | `rounded-4xl` (composant `Badge`) |
| Cartes, fenêtres | Rayon 8 px | `rounded-xl` (composants shadcn) |
| Pastilles rondes, compteurs, avatar | Rayon complet | `rounded-full` |
| Hauteur des contrôles | 32, 40 ou 48 px | `h-8`, `h-10`, `h-12` |

Le bouton shadcn par défaut mesure 32 px. La maquette utilise 40 px pour les boutons et les champs courants, et 48 px pour le bouton flottant.

> **Remarque :** nous recommandons `className="h-10 px-4"` sur les boutons et champs des formulaires principaux, et `size="sm"` pour les actions dans les cartes.

## Statuts des posts

| Statut en base | Libellé | Classes du `Badge` |
|---|---|---|
| `brouillon` | Brouillon | `variant="outline"`, texte `text-muted-foreground` |
| `en_relecture` | En relecture | `bg-warning-surface text-warning` |
| `valide` | Programmé | `bg-chip text-chip-foreground` |
| `publie` | Publié | `bg-success-surface text-success` |

Les badges de statut sont en majuscules, 11 px, avec une icône de 12 px.

*À confirmer : la maquette affiche « Programmé » ; le libellé du statut `valide` reste à arbitrer.*

## Mise en page

| Zone | Règle |
|---|---|
| Barre latérale | 248 px, fond `sidebar`, fixe à gauche. Sous 900 px de large, elle devient une barre horizontale en haut. |
| Zone principale | Marges de 32 px (16 px sous 900 px), espacement de 24 px entre blocs. |
| Bouton « Créer un nouveau post » | Flottant, centré en bas de la zone principale, `size` 48 px, `shadow-float`. |
| Fenêtres | `Dialog`, largeur maximale 560 px. |
| Notifications | [Sonner](https://sonner.emilkowal.ski/), en bas au centre. |

## Écarts entre la maquette et le cahier des charges

La maquette couvre l'accueil (calendrier) et la fenêtre « Paramétrer votre post ». L'éditeur, l'aperçu LinkedIn et la vue relecteur ne sont pas dessinés ; ils se composent avec les règles de ce document.

| Sujet | Maquette | Cahier des charges |
|---|---|---|
| Types de post | Expertise, Coulisses et équipe, Recrutement, Événement, Actualité entreprise | Ceux de `lib/post-types.ts` |
| Suggestions, agenda Gmail, statistiques, boîte à idées | Présents | Hors MVP |

*Question ouverte : la liste des types de post fait foi dans le cahier des charges ; l'alignement avec la maquette reste à décider avec le marketing.*

### Non mis en place

#### Police Archia

Les titres utilisent Helvetica Neue ou Arial tant que les fichiers d'Archia ne sont pas dans le projet.

> **Remarque :** Archia n'est pas distribuée par Google Fonts. Une fois les fichiers fournis, la charger avec `next/font/local` et pointer `--font-heading` sur sa variable.

#### Survol du bouton principal

Le bouton shadcn assombrit `primary` à 80 % au survol, alors que la maquette passe à `primary-hover`.

> **Remarque :** l'écart est visuel uniquement ; le corriger demande de modifier `components/ui/button.tsx`, ce que nous écartons tant que le design n'est pas figé.

#### Mode sombre

> **Remarque :** écarté par décision produit. Le bloc `.dark` a été retiré de `app/globals.css`.
