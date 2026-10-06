# Spec : paramétrage rédaction

6 octobre 2026 · @Tech Lead · v1.2, alignée avec les specs « Parcours de création d'un post LinkedIn » et « Écran Mon calendrier »

## 1. Contexte et parti pris

Le paramétrage rédaction est proposé à la première connexion, avant la première série, puis reste accessible en permanence depuis le menu. Il peut être passé et repris plus tard. Sans lui, l'IA produit des posts génériques.

**Périmètre v1** : publication sur la page LinkedIn de l'entreprise uniquement, par un admin Marketing / Comm ou RH. Les profils LinkedIn personnels des collaborateurs arrivent en P2.

- **Objectif mesurable** : une première série programmable en moins de 20 minutes à la première connexion (paramétrage compris), puis en moins de 10 minutes, cible de la spec Création de post.
- **Parti pris** : on sépare ce qu'on n'a jamais le droit d'écrire (la charte, commune à toute l'entreprise) de qui on est et comment ça sonne (la ligne éditoriale, propre à chaque équipe).
- **Priorité à la génération** : réglages de la série, puis gabarit, puis ligne éditoriale choisie. La charte s'impose toujours.
- **Frontière avec la spec Création de post** : la génération, l'édition, les statuts et la publication suivent cette spec. Ce document définit ce que le paramétrage lui transmet, et la connexion LinkedIn faite pendant l'onboarding.

| Brique | Répond à | Exemple |
| --- | --- | --- |
| Charte (une seule, commune) | Ce qu'on n'a jamais le droit d'écrire | Un client sous NDA, « Je suis ravi de vous annoncer », le tutoiement |
| Ligne éditoriale (Marketing, RH) | Qui on est, de quoi on parle, comment ça sonne, à quel rythme | Valeurs, cibles, piliers, voix « expert sobre », 3 posts de référence, 1 post par semaine |
| Gabarit (un par type de post) | Comment un type de post est construit | Retour d'expérience : contexte, problème, solution, leçon |

| Rôle | v1 | Plus tard |
| --- | --- | --- |
| Admin (rattaché à la ligne Marketing ou RH) | Connecte la page LinkedIn, paramètre la charte et sa ligne, crée les séries, nomme d'autres admins | P1 : relit et valide tous les posts, les siens compris |
| Contributeur (collaborateur) | Hors périmètre | P2 : publie sur son profil perso, dans le cadre de la charte et de la ligne |

## 2. Workflow

En v1, l'admin connecte la page LinkedIn de l'entreprise, puis configure la charte et sa ligne (Marketing ou RH) avant sa première série. Chaque étape peut être passée. Tout reste ensuite modifiable par versions. Le parcours contributeur arrive en P2.

```
Première connexion (admin)
  0. Connecter la page LinkedIn  ──> import des posts de la page
  1. Identité et valeurs
  2. Posts de référence (choisis parmi les posts importés, ou collés)
  3. Proposition de l'IA
  4. Charte et clients
  5. Test, puis activer la v1

Ensuite, à tout moment, depuis le menu « Paramétrage rédaction »
  Modifier ──> version brouillon ──> bac à sable avant / après ──> publier la version n+1
  Les posts Programmé, En cours, Publié, Archivé ne changent pas
```

- **Paramétrage passé** : la ligne Neutre s'applique, avec un bandeau « Ligne éditoriale non configurée ».
- **Page LinkedIn non connectée** : l'onboarding continue avec des posts collés à la main. La programmation reste impossible tant que la page n'est pas connectée (spec Création de post, P0 1).
- **Modification d'une ligne** : elle ne touche jamais un post Programmé, En cours, Publié ou Archivé. Les Brouillons gardent leur version, avec un bandeau qui propose de les régénérer.
- **Relecture (P1)** : chaque post passe par le statut En relecture avant d'être programmé. Un admin peut valider ses propres posts.

## 3. Écrans et user stories

Trois écrans couvrent la v1 : l'assistant de configuration, l'espace Paramétrage permanent et la connexion LinkedIn (partagée avec la spec Création de post). Mon style arrive en P2.

### E0. Connecter la page LinkedIn (étape 0 de l'onboarding)

C'est le même écran et la même connexion que l'écran E7 de la spec Création de post. Une seule connexion sert à lire les posts de la page et à publier.

- **Contenu** : explication en une phrase (« Connectez la page LinkedIn de l'entreprise pour que l'outil apprenne de vos posts et puisse publier à votre place »), bouton « Connecter la page LinkedIn », lien « Passer cette étape ».
- **Après OAuth** : l'admin choisit la page parmi celles qu'il administre. L'import démarre aussitôt, avec une barre de progression.
- **Import** : les 50 derniers posts de la page, sur 12 mois au plus (D23). Texte, date de publication, lien LinkedIn, présence d'une image.
- **Résultat** : « 42 posts importés ». Ils alimentent l'étape 2 (posts de référence), l'analyse de style de l'étape 3 et l'historique du calendrier.
- **Erreurs** : connexion refusée, compte qui n'administre aucune page, accès API non accordé par LinkedIn. Dans les 3 cas, message clair et bascule sur le collage manuel.
- **Réimport** : bouton « Réimporter les posts » dans l'espace Paramétrage. Pas de synchronisation automatique en v1.

Droits LinkedIn : lire les posts d'une page demande le scope `r_organization_social`, fourni par la même Community Management API que la publication (`w_organization_social`). [Likely] Une seule demande d'accès à LinkedIn couvre donc l'import et la publication ([source](https://bundle.social/blog/linkedin-api-permissions)).

### E1. Assistant de configuration (admin, 6 étapes avec l'étape 0, passable, sauvegarde automatique)

1. Identité : choix de la ligne (Marketing ou RH), nom de la marque, texte « qui sommes-nous », 3 valeurs, cibles.
2. Exemples : l'admin coche 3 à 5 posts de référence parmi les posts importés. Sans import, il les colle, ou choisit un style de départ parmi 3 (expert sobre, chaleureux, direct).
3. Proposition de l'IA : 3 adjectifs de voix, « on est / on n'est pas », piliers de contenu, fréquence cible de la ligne (défaut : 1 post par semaine, D22), longueur, emojis, hashtags et appel à l'action par défaut. Avec un import, l'IA s'appuie sur l'ensemble des posts importés, pas seulement les posts de référence. Tout est modifiable.
4. Charte (commune à toutes les lignes) : expressions interdites (liste anti-clichés préremplie), clients avec alias et statut, sujets sensibles, tutoiement ou vouvoiement, écriture inclusive.
5. Test : un post étalon sur une matière fixe, régénérable, puis « Activer la v1 ».

Un bouton « Passer » à chaque étape mène au calendrier, avec la ligne Neutre active.

### E2. Espace Paramétrage permanent

Entrée « Paramétrage rédaction » dans la navigation latérale, visible des admins (voir spec Écran Mon calendrier).

- **Onglets** : Connexion LinkedIn, Charte, Lignes (Marketing, RH), Gabarits, Admins, Versions.
- **Règle** : toute modification crée une version brouillon, testée dans un bac à sable avant / après, puis publiée.

### E3. Mon style (P2)

Coller 2 ou 3 textes, faire 5 duels de style ou passer. Résumé en 5 lignes modifiable. Accessible depuis l'entrée « Mes préférences » de la navigation.

### User stories

| ID | En tant que | Je veux | Critères d'acceptation |
| --- | --- | --- | --- |
| US0 | Admin | connecter la page LinkedIn dès l'onboarding pour que l'outil récupère nos posts | OAuth, choix de la page, import des 50 derniers posts sur 12 mois au plus. Même connexion que l'écran E7 de la spec Création de post. Étape passable. |
| US1 | Admin | configurer une ligne en moins de 15 minutes | Étapes avec progression. Sauvegarde auto. Assistant entier passable, reprise depuis le menu. |
| US2 | Admin | une proposition de ligne tirée de nos posts | Réponse en moins de 30 s. Basée sur les posts importés s'il y en a, sinon sur les posts collés. Chaque champ modifiable. Bouton « Proposer à nouveau ». |
| US3 | Admin | tester une ligne avant de l'activer | Post étalon sur matière fixe. Vue avant / après dès qu'un champ change. |
| US4 | Admin | saisir les clients et leur statut | Saisie manuelle : nom, alias, statut (citable, citable sans détail, non citable). Client non citable détecté : programmation bloquée avec la raison (spec Création de post, P0 6). |
| US5 | Admin | gérer une ligne Marketing et une ligne RH | Chaque ligne a ses versions. La ligne se choisit dans le formulaire de série. La charte reste commune. |
| US6 | Admin | nommer et retirer des admins | Nombre libre. Chaque admin est rattaché à une ligne. Impossible de retirer le dernier admin d'une ligne. |
| US7 | Admin | modifier une ligne après coup | Nouvelle version en brouillon, publication explicite. Les séries gardent leur version figée. Bandeau sur les Brouillons avec régénération proposée. |
| US8 | Admin | créer une série même si le paramétrage a été passé | Ligne Neutre active et bandeau « Ligne éditoriale non configurée ». |
| US9 (P1) | Admin | relire et valider chaque post avant sa programmation | Statut En relecture. Un admin peut valider ses propres posts. |
| US10 (P2) | Contributeur | définir mon style en 3 minutes | 3 options. Résumé modifiable. |

## 4. Modèle de données et versioning

La charte et les lignes sont versionnées séparément, et c'est la série, pas le post, qui fige les versions utilisées.

| Entité | Champs clés | Remarques |
| --- | --- | --- |
| `linkedin_connection` | id, workspace_id, publication_target_id, admin_user_id, token chiffré, expires_at, scopes | Partagée avec la spec Création de post (E7). Token jamais renvoyé au navigateur. |
| `publication_target` | id, type (page ou profil), linkedin_urn, name, logo_url | Page en v1, profil en P2. |
| `post` importé | Voir spec Création de post : `origin = linkedin_import`, statut `published`, lecture seule | Créé par l'import. Sert d'exemple de style, d'historique au calendrier et de base à l'indicateur « Dernier post ». |
| `editorial_line` | id, workspace_id, name (Marketing, RH, Neutre) | La ligne Neutre existe dès l'installation et sert quand le paramétrage est passé. |
| `editorial_line_version` | id, line_id, version, status (draft, active, archived), identity (marque, about, valeurs, cibles), voice (adjectifs, we_are, we_are_not), pillars, target_frequency, defaults (longueur, emojis, hashtags, cta), reference_post_ids, created_by, published_at | Une seule version active par ligne. Jamais modifiée une fois publiée. `target_frequency` alimente les indicateurs et suggestions du calendrier. |
| `guardrails_version` (charte) | id, version, status, banned_expressions, clients (nom, alias, statut), sensitive_topics, address_form (tu, vous), inclusive_writing | Une seule charte pour toute l'entreprise, modifiable par tous les admins (D24). Clients saisis à la main par un admin. |
| `post_template` (gabarit) | id, code, label, objective, audience, questions, structure, defaults, example_post | Source unique des types de post, utilisée par la spec Création de post et par le calendrier. Un seul gabarit par série en v1. |
| `user_role` | user_id, role (admin), line_id (Marketing ou RH), granted_by, granted_at | Nombre d'admins libre. Un admin ne modifie que la ligne de son équipe (D15), mais tous les admins modifient la charte (D24). Au moins un admin par ligne à tout moment. |
| `series` (champs ajoutés) | editorial_line_version_id, guardrails_version_id, template_id, settings_snapshot, angle_plan | Figés à la génération (spec Création de post, P0 3). |
| `post` (champs ajoutés) | angle, guardrail_report, validated_by, validated_at (P1) | Rapport recalculé à l'édition, à la programmation et à la publication. |
| `author_profile` (P2) | user_id, samples, style_summary, preferences | Pas créé en v1. |

Types de post (liste unique, portée par les gabarits, validée en D21) :

| Code | Libellé | Gabarit détaillé au hackathon |
| --- | --- | --- |
| `newcomer` | Arrivée d'un collaborateur | Oui |
| `project_delivered` | Projet livré | Oui |
| `tech_feedback` | Retour d'expérience technique | Non, gabarit générique |
| `event` | Événement | Non, gabarit générique |
| `employer_brand` | Marque employeur (coulisses et équipe) | Non, gabarit générique |
| `hiring` | Recrutement | Non, gabarit générique |

Règles de versioning :

- Modifier une ligne ou la charte crée une version `draft`. La publier la passe en `active` et archive l'ancienne.
- Une série garde les versions figées à sa génération. Un post Programmé, En cours, Publié ou Archivé ne change jamais de texte.
- Les Brouillons gardent leur version, avec un bandeau « Nouvelle ligne disponible, régénérer les brouillons ? ».
- Exception : le contrôle de publication utilise toujours la charte active.
- Conservation (D16) : le brief de chaque série, chaque version de texte d'un post et les posts publiés sont gardés sans limite de durée en v1. Une purge des briefs (par exemple au bout d'un an) est à prévoir plus tard, sans toucher aux posts publiés.

## 5. Assemblage du prompt et contrôle des garde-fous

Le prompt s'assemble toujours dans le même ordre, les garde-fous sont vérifiés par du code, et le modèle est Claude, appelé via l'API Anthropic. Une série se génère en deux temps, comme le prévoit la spec Création de post (P0 3) : un plan d'angles, puis un appel par post.

Ordre d'assemblage :

1. Rôle et règles LinkedIn : accroche dans les 210 premiers caractères environ, 3 000 caractères maximum, pas de markdown, pas de gras en caractères Unicode ([source](https://howmanywords.app/blog/linkedin-character-limits)).
2. Charte, formulée comme règles impératives.
3. Ligne éditoriale choisie pour la série (Marketing ou RH), ou ligne Neutre si le paramétrage a été passé. Les posts de référence sont passés comme exemples.
4. Gabarit du type de post : structure et questions.
5. Réglages de la série (ton, longueur, emojis, hashtags, appel à l'action).
6. Sujet et brief de la série.
7. Appel 1, plan d'angles : blocs 1 à 6, plus les piliers de la ligne et la liste des dates. Il rend un angle par date.
8. Appels suivants, un par post : blocs 1 à 6, plus l'angle du post. Un post régénéré seul garde son angle.

Contrôle de la charte, à 4 moments :

- Avant génération : le sujet et le brief sont scannés. Un client non citable bloque la génération avant même l'appel au modèle.
- Après génération et à chaque édition : le post est scanné (expressions interdites, clients et alias sans tenir compte de la casse et des accents, longueur, nombre de hashtags).
- À la programmation : un client non citable bloque le passage en Programmé (spec Création de post, P0 6). Si aucun client n'est déclaré, un avertissement « Aucun client déclaré » s'affiche, sans bloquer (D17).
- À la publication (Programmé vers En cours) : le contrôle est relancé avec la charte active. Un client devenu non citable entre-temps fait passer le post en Échec, motif « garde-fou » (D11).

Le mode manuel passe par les mêmes contrôles, sans appel au modèle. Le résultat est un `guardrail_report` affiché en checklist : client non citable = bloquant, le reste = avertissement.

Pourquoi du code : c'est fiable, testable unitairement et démontrable en direct, là où un modèle peut laisser passer un nom.

Données côté Anthropic : les entrées et sorties de l'API sont supprimées sous 30 jours par défaut, sauf signalement au titre de la politique d'usage (jusqu'à 2 ans). Un accord de rétention zéro est possible ([source](https://privacy.claude.com/en/articles/7996866)).

## 6. Périmètre hackathon et plus tard

Pour le hackathon, on garde ce qui se voit en démo : l'import des posts de la page, la proposition de ligne par l'IA, deux lignes qui sonnent différemment et le blocage d'un client non citable.

| Élément | Hackathon | Plus tard |
| --- | --- | --- |
| Connexion LinkedIn et import des posts | Oui si l'accès Community Management API est obtenu, sinon posts collés et données de démo | Synchronisation automatique (P1) |
| Assistant de configuration | 4 étapes passables : connexion, identité et exemples, charte, test | Toutes les étapes |
| Proposition de ligne par l'IA | Oui | Import depuis l'URL du site |
| Lignes éditoriales | Marketing, RH et Neutre | Autres lignes si besoin |
| Charte et contrôle des clients | Oui, aux 4 moments | Suivi des changements de contrat (P2) |
| Gestion des admins | Admins créés en base | Écran Admins dans le paramétrage |
| Relecture | Hors hackathon | P1 : statut En relecture |
| Gabarits | 2 types détaillés (arrivée d'un collaborateur, projet livré), les autres en générique | Éditeur de gabarits, gabarit par post (P1) |
| Versioning | v1 seule | Historique, comparaison, bandeau sur les Brouillons |
| Mon style et profils perso | Hors v1 | P2 |
| Données de démo | Espace prérempli et bouton « Réinitialiser » | Sans objet |

Scénario de démo en 60 secondes : l'admin connecte la page, l'IA importe les posts et propose la ligne Marketing. Il génère le même sujet avec la ligne Marketing puis avec la ligne RH : deux voix différentes. Enfin, la programmation est bloquée sur un client non citable.

## 7. Décisions

| # | Décision | Quand |
| --- | --- | --- |
| D1 | La charte et la ligne définies par l'admin s'appliqueront aussi aux profils LinkedIn personnels | P2 |
| D2 | Un admin relit tous les posts avant leur programmation | P1 pour la page, P2 pour les profils |
| D3 | Quand une ligne change, les Brouillons gardent leur version, avec un bandeau et une régénération proposée | v1 |
| D4 | Une ligne Marketing et une ligne RH, une charte commune | v1 |
| D5 | Ligne par défaut pour les contributeurs | P2 |
| D6 | Nombre d'admins libre, nommés et retirés par les admins, jamais zéro admin | v1 |
| D7 | Clients saisis à la main par un admin, avec leurs alias | v1 |
| D8 | Interdits personnels dans Mon style | P2 |
| D9 | Les admins tiennent la liste des clients. Le suivi des changements de contrat vient plus tard | v1, suivi en P2 |
| D10 | Modèle : Claude, via l'API Anthropic | v1 |
| D11 | Contrôle de la charte relancé au moment de la publication | v1 |
| D12 | Un seul gabarit par série | v1, gabarit par post en P1 |
| D13 | Paramétrage proposé avant la première série, passable, ligne Neutre en attendant | v1 |
| D14 | Statut En relecture, un admin peut valider ses propres posts | P1 |
| D15 | Chaque admin ne modifie que la ligne de son équipe (Marketing ou RH) | v1 |
| D16 | Briefs, versions des posts et posts publiés conservés sans limite de durée | v1, purge des briefs plus tard |
| D17 | Liste de clients vide : avertissement « Aucun client déclaré » à la programmation, non bloquant | v1 |
| D18 | Une série peut contenir un seul post (arrivée d'un collaborateur, projet livré) | v1 |
| D19 | Pas de seconde validation pour publier une nouvelle version de ligne ou de charte | v1 |
| D20 | L'onboarding commence par la connexion de la page LinkedIn et l'import de ses posts. Connexion partagée avec la spec Création de post | v1 |
| D21 | 6 types de post, portés par les gabarits : arrivée d'un collaborateur, projet livré, retour d'expérience technique, événement, marque employeur, recrutement | v1 |
| D22 | Objectif de rythme fixé par ligne éditoriale, par l'admin (`target_frequency`) | v1 |
| D23 | Import des 50 derniers posts de la page, sur 12 mois au plus | v1 |
| D24 | Tous les admins peuvent modifier la charte commune | v1 |
| D25 | Outil desktop uniquement, aucun affichage mobile | v1 |
| D26 | Liste des posts accessible par l'entrée « Tous les posts » de la navigation | v1 |
| D27 | Chaque admin voit tous les posts de la page, filtrables par ligne | v1 |
| D28 | Boîte à idées partagée entre tous les admins | v1 |

## 8. Alignement avec les autres specs

Ce que cette spec fournit, et à qui.

| Ce que le paramétrage fournit | Consommé par | Où |
| --- | --- | --- |
| Connexion LinkedIn (`linkedin_connection`) | Création de post | E7, programmation, publication |
| Posts importés de la page (`origin = linkedin_import`) | Mon calendrier | Posts publiés dans la grille, indicateur « Dernier post sur la page » |
| Lignes éditoriales actives (Marketing, RH, Neutre) | Création de post | E2, champ « Ligne éditoriale » |
| `target_frequency` de la ligne | Mon calendrier | Indicateurs de rythme, suggestion « Rythme » |
| Gabarits (liste des types de post) | Création de post, Mon calendrier | E2 « Type de post », suggestions, filtre |
| Charte et `guardrail_report` | Création de post | Contrôles aux 4 moments, messages |
| Entrée de navigation « Paramétrage rédaction » | Mon calendrier | Navigation latérale, admins |

Règles communes aux 3 specs :

- Le statut de relecture s'appelle « En relecture » (code `pending`) dans les 3 specs, et arrive en P1.
- La liste des types de post vient des gabarits de cette spec (D21). Le calendrier et la création de post la lisent, sans liste en dur.
- Outil desktop uniquement (D25).

Aucune question ouverte dans cette version.
