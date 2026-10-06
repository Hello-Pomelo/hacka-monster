# Specs

Quatre specs, une par périmètre, à développer en parallèle. Chacune est autonome et se termine par une section « Alignement avec les autres specs » : ce qu'elle lit des autres et ce qu'elle leur fournit.

| Spec | Couvre | Écrans |
|---|---|---|
| [Paramétrage rédaction](spec-parametrage-redaction.md) | Onboarding, connexion LinkedIn et import des posts, charte, lignes éditoriales, gabarits, assemblage du prompt, garde-fous | E0 à E3 (E3 en P2) |
| [Création d'un post LinkedIn](spec-creation-post-linkedin.md) | Nouveau post, série générée, édition, aperçu, statuts, programmation, publication, liste des posts | E1 à E7 |
| [Écran Mon calendrier](spec-ecran-mon-calendrier.md) | Écran d'accueil : navigation, indicateurs de rythme, calendrier, suggestions, boîte à idées | Un seul écran |
| [Créneaux conseillés à la planification](spec-creneaux-conseilles-planification.md) | Jour, heure et date de début préremplis selon le type de post, raison affichée, heure de Paris | Création de post, E2 (E3 et mode manuel en P1) |

Les numéros d'écran sont propres à chaque spec : écrire « Création de post, E3 » plutôt que « E3 ».

## Contrats partagés

Chaque élément commun a une seule source de vérité. Les autres specs le lisent sans le redéfinir.

| Élément | Source de vérité | Lu par |
|---|---|---|
| Post et série : champs, statuts, codes, transitions | Création de post (Paramétrage y ajoute des champs, section 4) | Calendrier, Paramétrage |
| Connexion LinkedIn et import des posts | Paramétrage (E0, entité `linkedin_connection`) et Création de post (E7, gestion) | Calendrier |
| Types de post (gabarits, 6 codes) | Paramétrage | Création de post, Calendrier |
| Lignes éditoriales et `target_frequency` | Paramétrage | Création de post, Calendrier |
| Charte, garde-fous, assemblage du prompt | Paramétrage (sections 4 et 5) | Création de post |
| Points d'entrée de la création et préremplissage | Calendrier (section 3.7) | Création de post (E1) |
| Navigation latérale | Calendrier (section 3.1) | Paramétrage, Création de post |

Pour changer un contrat partagé : modifier d'abord la spec qui fait foi, puis la section « Alignement » des specs qui le lisent, et prévenir l'équipe.

## Règles communes

- Statut « En relecture » (code `pending`) en P1 seulement.
- Types de post lus depuis les gabarits, jamais en dur (D21).
- Outil desktop uniquement (D25).
