# Hello Pomelo Posts : spécifications de l'écran « Mon calendrier »

Version : 9 (6 octobre 2026), alignée avec les specs « Paramétrage rédaction » (v1.2) et « Parcours de création d'un post LinkedIn »
Statut : rétro-documentation de la maquette publiée, mise à jour pour l'alignement. À valider avant développement.

Changements des versions 8 et 9 : outil desktop uniquement, questions Q5, Q9, Q10, Q16, Q17 et Q18 tranchées, publication sur la page entreprise uniquement en v1, rôles alignés sur la spec Paramétrage, statuts et codes repris de la spec Création de post, création de post déléguée à la spec Création de post, nouvelles entrées de navigation, historique alimenté par l'import des posts de la page.

Légende de confiance, reprise du design.md :

| Tag | Signification |
|---|---|
| [Certain] | Demandé explicitement dans le brief ou dans les retours de revue |
| [Likely] | Déduit du brief ou de la charte, avec peu de doute |
| [Guessing] | Décision prise pour la maquette, sans validation. À trancher |

---

## 1. Contexte produit

### 1.1 Problème
Les publications LinkedIn de Hello Pomelo manquent de régularité. L'entreprise se fait connaître quand elle prend la parole souvent, et donne envie de la rejoindre quand ses équipes racontent leur quotidien. [Certain]

### 1.2 Enjeux
1. Notoriété : prendre la parole plus souvent sur LinkedIn. [Certain]
2. Marque employeur : montrer la réalité des métiers et des équipes. [Certain]
3. Régularité : faire vivre les publications dans la durée. [Certain]

### 1.3 Concept
Un community manager virtuel. L'utilisateur paramètre un post, l'IA le rédige dans le ton de l'entreprise, l'utilisateur le relit, l'ajuste puis le valide. Le post est l'objet central de l'outil. [Certain]

Référence : Lyter (idées de posts, questions guidées, rédaction dans le style de l'auteur, visuels, programmation). [Certain]

### 1.4 Utilisateurs et rôles

| Rôle | Peut faire | Quand | Confiance |
|---|---|---|---|
| Admin (rattaché à la ligne Marketing / Comm ou RH) | Créer des posts pour la page entreprise, paramétrer sa ligne et la charte, nommer d'autres admins | v1 | [Certain] décisions D4, D6, D15 de la spec Paramétrage |
| Admin relecteur | Relire et valider tous les posts, les siens compris, dans « Posts à valider » | P1 | [Certain] décisions D2 et D14 |
| Collaborateur | Publier depuis son compte LinkedIn personnel | P2 | [Certain] décision D1 |

Le rôle « Super admin » de la maquette devient « Admin ». Un seul rôle en v1.

Règle de validation : en P1, tout post passe par le statut En relecture et un admin le valide, y compris un admin qui valide ses propres posts. En v1, pas de relecture : l'admin programme directement. [Certain]

Périmètre v1 : la page LinkedIn de l'entreprise uniquement. Les comptes personnels arrivent en P2. [Certain] décision D1 et spec Création de post.

---

## 2. Rôle de l'écran

Écran d'accueil de l'outil. Il répond à trois questions en un coup d'œil : [Likely]

1. Qu'est-ce qui est déjà programmé ?
2. Quand devrais-je prendre la parole, et pourquoi ?
3. Comment créer un post maintenant ?

---

## 3. Structure de l'écran

### 3.1 Navigation latérale (bleu nuit, section-inverse)

Ordre des entrées :

| Entrée | Visibilité | Compteur | Comportement maquette | Confiance |
|---|---|---|---|---|
| Mon calendrier | Admins | Non | Page active | [Certain] |
| Boîte à idées | Admins | Nombre d'idées | Ouvre l'onglet Idées sous le calendrier | [Certain] entrée, [Guessing] comportement |
| Tous les posts | Admins | Nombre de posts en Échec, en rose | Ouvre la liste des posts (spec Création de post, E6) | [Certain] décision D26 |
| Posts à valider | Admins, en P1 | Nombre de posts En relecture, en rose | Liste des posts En relecture, ouvre l'éditeur (spec Création de post, E3) | [Certain] décision D14 |
| Paramétrage rédaction | Admins | Non | Espace Paramétrage (spec Paramétrage, E2) | [Certain] la spec Paramétrage exige un accès permanent depuis le menu |
| Mes préférences | Admins | Non | En P2 : Mon style (spec Paramétrage, E3). Masquée en v1 | [Likely] |
| Statistiques | Admins | Non | Hors v1 (non-objectif de la spec Création de post). Masquée en v1 | [Likely] |

Bas de la navigation :
1. État des connexions : page LinkedIn connectée (état lu sur la connexion de la spec Création de post, E7, avec sa date d'expiration), agenda synchronisé avec l'heure de dernière synchro. Clic sur l'état LinkedIn : onglet « Connexion LinkedIn » du paramétrage. [Likely]
2. Bouton utilisateur (avatar, nom, « Paramètres du compte ») qui donne accès aux paramètres du compte. [Certain]

Desktop uniquement : pas d'affichage mobile, comme la spec Création de post. Les règles mobiles de la maquette sont retirées. [Certain] décision D25

### 3.2 En-tête

1. Tag « Mon calendrier » avec icône (tag principal de la charte). [Likely]
2. Titre : « Bonjour {prénom}, {n} posts programmés dans le prochain mois ». [Certain]
   - {n} = posts au statut Programmé (et En relecture à partir de P1), entre aujourd'hui et aujourd'hui + 1 mois. Les brouillons ne comptent pas. [Guessing]
   - Le nombre et le mot « posts programmés » sont en rose (surbrillance de la charte). [Likely]
   - Cas {n} = 0 non traité. Voir question Q12.
3. Bandeau « Données d'exemple ». Propre à la maquette, à retirer en production.
4. Sélecteur « Aperçu de la maquette en tant que : Collaborateur / Super admin ». Propre à la maquette, à retirer en production.

### 3.3 Indicateurs de rythme (4 cartes)

| Indicateur | Contenu | Règle | Confiance |
|---|---|---|---|
| Dernier post sur la page | « 12 jours, le 24 sept. » + badge « Objectif : 1 par semaine » | Calculé sur les posts Publié, y compris les posts importés depuis LinkedIn à l'onboarding. Objectif = fréquence cible de la ligne éditoriale (`target_frequency`, spec Paramétrage). Badge d'avertissement si le délai dépasse l'objectif. Avec le filtre « Toutes », l'objectif est la somme des fréquences des lignes | [Certain] décision D22 |
| Programmés en octobre | « 3 sur 4 visés » + jauge | Compte Programmé, En relecture (P1) et Publié du mois en cours. Cible issue de `target_frequency` de la ligne filtrée | [Certain] D22 pour la cible, [Guessing] pour le rendu |
| En relecture | « 1 post » + lien « Voir le post » | Compte les posts En relecture. Carte masquée en v1, affichée en P1 | [Likely] |
| Suggestions à traiter | « 5 d'ici fin octobre » | Suggestions non traitées jusqu'à la fin du mois | [Guessing] |

### 3.4 Calendrier (élément central, pleine largeur)

Pleine largeur. [Certain]

Le calendrier affiche tous les posts de la page, quel que soit l'admin qui les a créés. [Certain] décision D27

Barre d'outils :
1. Mois précédent, mois suivant, libellé du mois, bouton « Aujourd'hui ». [Likely]
2. Filtre par ligne éditoriale : Toutes, Marketing, RH. Le filtre par compte (Mon compte, Page entreprise) revient en P2 avec les profils personnels. [Certain] décision D27
3. Interrupteurs : Suggestions, Agenda Gmail. [Guessing]

Grille mensuelle, semaine du lundi au dimanche. Jours hors mois sur fond gris. Aujourd'hui marqué par une pastille rose. Le jour sélectionné a un contour rose. [Likely]

Éléments affichés dans une case, par ordre d'importance visuelle :

| Élément | Rendu | Confiance |
|---|---|---|
| Post programmé | Bloc plein bleu nuit, texte blanc, icône du compte, heure en gras, titre sur 2 lignes | [Certain] demandé plus visible en revue, rendu [Guessing] |
| Post en relecture (P1) | Même bloc bleu, icône sablier jaune | [Guessing] |
| Brouillon | Contour gris, sans fond. Libellé « À relire » si l'auteur ne l'a pas encore validé (spec Création de post) | [Guessing] |
| En cours | Rendu de Programmé, libellé « Publication en cours » | [Likely] |
| Échec | Contour rouge, icône d'alerte, motif au survol | [Likely] statut manquant ajouté, rendu [Guessing] |
| Publié | Texte gris, coche verte. Inclut les posts importés depuis LinkedIn | [Guessing] |
| Archivé | Non affiché | [Likely] |
| Suggestion de l'assistant | Contour rose en pointillés, sans fond, icône étincelle | [Certain] demandé, rendu [Guessing] |
| Événement de l'agenda | Texte gris discret, icône enveloppe | [Certain] demandé, rendu [Guessing] |

Titre affiché pour un post : les premiers mots de son texte (l'accroche), tronqués sur 2 lignes. Le post n'a pas de champ titre dans la spec Création de post. [Likely]

Maximum 3 éléments par case, puis « + N autres ». [Guessing]

Clic sur un jour ou un élément : le détail du jour s'affiche sous le calendrier et la page défile juste assez pour le montrer. [Guessing]

Légende sous la grille. [Likely]

### 3.5 Bloc sous le calendrier

Placé sous le calendrier, même sur grand écran. [Certain]

Trois onglets :

1. **Suggestions** (onglet par défaut). Cartes avec : motif (badge), date conseillée, titre, explication, ligne conseillée, boutons « Rédiger ce post » et « Ignorer ». Rédiger ce post ouvre la création de post (spec Création de post, E1) préremplie. Ignorer propose d'annuler pendant 5 secondes. [Guessing]
2. **À venir**. Liste des posts non publiés à partir d'aujourd'hui : date, titre, statut, ligne, heure. Clic = détail du jour. Lien « Voir tous les posts » vers la liste (spec Création de post, E6). [Guessing]
3. **Idées** (boîte à idées, partagée entre tous les admins, D28). Champ « Notez une idée en une phrase » + Ajouter. Chaque idée : texte, auteur, date de saisie, boutons « Planifier » et « Supprimer ». Tout admin peut planifier ou supprimer une idée. Planifier ouvre la création de post (E1) préremplie, l'idée disparaît une fois le brouillon créé. [Certain] pour la boîte à idées, [Guessing] pour le contenu

Vue jour (après clic sur une date) : événements de l'agenda, posts du jour avec bouton « Ouvrir le post » (éditeur, spec Création de post, E3) ou « Voir sur LinkedIn » pour un post Publié, suggestions du jour, bouton « Créer un post ce jour » si la date n'est pas passée. « Voir les résultats » est retiré en v1 : les statistiques sont hors périmètre. [Guessing]

### 3.6 Bouton principal flottant

« Créer un nouveau post », bouton primaire rose 48px, fixe en bas au centre de la zone de contenu. Il ouvre la modale « Nouveau post » de la spec Création de post (E1). [Certain]
Seule ombre portée de l'écran, justifiée par sa fonction de bouton flottant. [Guessing], exception à la charte à valider.

### 3.7 Création d'un post depuis le calendrier

La fenêtre « Paramétrer votre post » de la maquette est remplacée par le parcours de la spec Création de post, pour qu'un seul formulaire existe. [Certain] décision d'alignement

Le bouton flottant, « Rédiger ce post », « Planifier » et « Créer un post ce jour » ouvrent la modale « Nouveau post » (E1), puis le formulaire de série (E2). Le calendrier transmet des valeurs de préremplissage :

| Champ de la maquette | Devient, dans la spec Création de post | Règle |
|---|---|---|
| Publier depuis | Supprimé en v1 | La v1 publie uniquement sur la page entreprise. Revient en P2 avec les profils personnels |
| Type de prise de parole | Type de post (gabarit) | Liste unique de 6 types fournie par la spec Paramétrage (D21) : arrivée d'un collaborateur, projet livré, retour d'expérience technique, événement, marque employeur, recrutement. Codes `newcomer`, `project_delivered`, `tech_feedback`, `event`, `employer_brand`, `hiring` |
| Sujet | Sujet et brief | Repris de la suggestion ou de l'idée |
| Date et heure de publication | Date de début et heure | Date cliquée ou date conseillée. Défaut 8 h 30 |
| (nouveau) | Ligne éditoriale | Marketing ou RH. Suggestion Recrutement : RH. Sinon la ligne de l'admin |

Le post créé arrive en Brouillon et apparaît dans le calendrier à sa date. [Certain] spec Création de post

---

## 4. Modèle de données utilisé par la maquette

### 4.1 Post

Le calendrier lit l'entité post de la spec Création de post. Il n'a pas de modèle propre.

| Champ lu | Valeurs |
|---|---|
| date, heure | Date et heure de publication |
| publication_target | Page entreprise en v1. Profil personnel en P2 (remplace `me` et `company`) |
| ligne | Ligne éditoriale de la série : Marketing, RH ou Neutre |
| statut | `draft` Brouillon, `pending` En relecture (P1), `scheduled` Programmé, `publishing` En cours, `published` Publié, `failed` Échec, `archived` Archivé |
| type | Code du gabarit, voir 3.7 |
| texte | Le titre affiché en est tiré (voir 3.4) |
| origin | `app` ou `linkedin_import` (posts récupérés à l'onboarding, en lecture seule) |
| lien LinkedIn, motif d'échec | Selon le statut |

Cycle de vie : celui de la spec Création de post, avec ses transitions. Refus de relecture (P1) : retour en Brouillon avec un motif. Échec de publication : statut Échec avec motif. Post annulé : Archivé. [Certain] Q8 tranchée.

### 4.2 Suggestion
| Champ | Valeurs |
|---|---|
| date conseillée | Date |
| motif | `rhythm` Rythme, `gmail` Agenda, `hr` Recrutement, `team` Marque employeur |
| ligne conseillée | Marketing ou RH (remplace le compte conseillé en v1) |
| type | Code du gabarit |
| titre, explication, sujet pré-rempli | Texte |

### 4.3 Idée
| Champ | Valeurs |
|---|---|
| texte | Une phrase |
| date de saisie | Date |
| auteur | Admin qui a noté l'idée. Boîte partagée entre tous les admins (D28) |

### 4.4 Événement d'agenda
Titre, date, heure facultative. Lu depuis l'agenda Google de l'utilisateur. [Certain] pour la source, voir Q6.

---

## 5. Règles de suggestion (moteur de recommandation)

Le brief en cite trois : un événement détecté dans l'agenda, une longue période sans publication, « x raisons » recommandées par l'outil. [Certain]

Règles inventées pour la maquette, toutes [Guessing] :

En v1, toutes les suggestions visent la page entreprise. Le compte personnel conseillé revient en P2. [Certain] décision D1

| Motif | Déclencheur | Date conseillée | Ligne et type conseillés |
|---|---|---|---|
| Rythme | Délai depuis le dernier post Publié (importés compris) supérieur à la fréquence cible de la ligne (`target_frequency`) | Le lendemain | Ligne concernée |
| Agenda, avant | Événement public dans l'agenda | La veille | Marketing, type `event` |
| Agenda, après | Même événement | Le lendemain | Marketing, type `event` |
| Recrutement | Offre ouverte depuis plus de 21 jours sans post associé | Sous 2 semaines | RH, type `hiring` |
| Marque employeur | Aucun post de type `employer_brand` depuis 5 semaines | Sous 3 semaines | RH, type `employer_brand` |

---

## 6. Design system appliqué

Source : design.md Hello Pomelo (Brand guidelines 2026). Nommage des variables aligné sur shadcn/ui pour faciliter une migration vers les vrais composants.

### 6.1 Décisions structurantes
1. Mode clair uniquement. [Certain] demandé en revue
2. Composants recréés en HTML, CSS et JS sans framework, inspirés de shadcn/ui. [Certain] validé
3. Profondeur par aplats : fond de page gris (grey-50), surfaces blanches. Aucune ombre sauf le bouton flottant. [Certain] charte slide 63
4. Densité adaptée à un outil : contrôles de 32, 40 et 48px, titres de 16 à 32px. [Guessing], la charte est calibrée pour le marketing
5. Interligne du texte courant à 140 % au lieu de 110 %. [Guessing]

### 6.2 Écarts volontaires à la charte, à valider
| Écart | Raison |
|---|---|
| Liens et tags en pink-600 au lieu de pink-500 sur fond clair | pink-500 sur grey-50 = 4.28:1, sous le seuil AA |
| Texte des chips et notes en blue-a80 au lieu de blue-a60 ou blue-a40 | Contraste AA (voir E1 du design.md) |
| Focus visible : contour 2px pink-500 | La charte ne définit aucun focus |
| Champs de formulaire bordés en grey-400 | grey-200 = 1.59:1, insuffisant |
| Ombre sous le bouton flottant | Seul moyen de le détacher du contenu qui défile |
| Archia remplacée par Helvetica Neue ou Arial | Police commerciale non fournie |
| Logo remplacé par le nom en texte | SVG non fourni |

### 6.3 Icônes
Remix Icon, intégrées en SVG dans la page. [Certain] charte slides 40 et 42

---

## 7. Hors périmètre de cet écran
1. Rédaction assistée par l'IA, édition, programmation : spec Création de post.
2. Ligne éditoriale, charte, gabarits, connexion LinkedIn et import des posts : spec Paramétrage rédaction.
3. Écrans Posts à valider (P1), Mes préférences (P2), Statistiques (hors v1), Paramètres du compte.
4. Génération de visuels.
5. Publication réelle sur LinkedIn (spec Création de post) et lecture réelle de l'agenda.
6. Persistance des données : la maquette garde tout en mémoire et repart de zéro au rechargement.

---

## 8. Points à éclaircir

Classés par impact sur le développement.

| # | Question | Pourquoi c'est bloquant |
|---|---|---|
| Q1 | La validation est-elle réservée au super admin, ou à un rôle « Relecteur » attribué à toute l'équipe com ? **Tranché : tout admin valide, les siens compris, en P1 (D2, D14).** | Modèle de rôles et de droits |
| Q2 | Qui utilise l'outil : seulement marketing et RH, ou tous les collaborateurs ? **Tranché : les admins Marketing / Comm et RH en v1, les collaborateurs en P2 (D1, D4).** | La marque employeur repose sur la prise de parole des équipes. Le brief limite la création à marketing et RH |
| Q3 | L'outil publie-t-il lui-même sur LinkedIn, ou l'utilisateur copie-colle le texte final ? **Tranché : l'outil publie lui-même sur la page (spec Création de post, P0 7).** | Publier pour une page entreprise demande un accès API validé par LinkedIn, avec un délai |
| Q4 | Les posts personnels passent-ils aussi par une relecture, même optionnelle ? **Tranché : oui, en P2 avec les profils personnels (D2).** | Cycle de vie du post |
| Q5 | L'objectif de rythme (1 par semaine, 4 par mois) est-il individuel ou collectif, et qui le fixe ? **Tranché : collectif, par ligne éditoriale, fixé par l'admin dans le paramétrage (`target_frequency`, D22).** | Indicateurs et suggestions « Rythme » |
| Q6 | Le « calendrier Gmail » désigne-t-il bien Google Agenda ? Quels événements faut-il exclure (réunions internes, rendez-vous privés) ? | Accès Google, confidentialité, bruit dans les suggestions |
| Q7 | D'où viennent les offres d'emploi pour les suggestions Recrutement (quel ATS) ? | Intégration à prévoir |
| Q8 | Que devient un post refusé en relecture ? Et un post dont la publication échoue ? **Tranché : refus = retour en Brouillon avec motif (P1), échec = statut Échec avec motif (spec Création de post).** | Statuts manquants |
| Q9 | Un admin voit-il les posts de toute l'équipe, ou seulement les siens ? **Tranché : tous les posts de la page, filtrables par ligne (D27).** | Vue équipe et filtres |
| Q10 | La boîte à idées est-elle personnelle, ou partagée avec l'équipe com ? **Tranché : partagée entre tous les admins (D28).** | Modèle de données et droits |
| Q11 | Une suggestion ignorée disparaît-elle pour de bon ? L'utilisateur peut-il dire pourquoi ? | Apprentissage du moteur de suggestions |
| Q12 | Quel titre afficher quand aucun post n'est programmé ? | Cas fréquent pour un nouvel utilisateur |
| Q13 | LinkedIn a lancé en juillet 2025 des API de statistiques pour les posts des comptes personnels (Member Post Analytics). Quelles conditions d'accès s'appliquent à un outil interne, et faut-il en faire la demande en plus de celle pour la page entreprise ? | Périmètre de l'écran Statistiques |
| Q14 | Fichiers Archia (.woff2) et logo SVG, avec une licence couvrant l'usage web | Fidélité à la charte |
| Q15 | L'ombre du bouton flottant est-elle acceptée par les propriétaires de la charte ? | Exception à la règle « aucune ombre » |
| Q16 | La liste des 6 types de post (gabarits) convient-elle ? Elle remplace la liste de la maquette (Expertise, Coulisses et équipe, Recrutement, Événement, Actualité entreprise). **Tranché : oui, les 6 types du CDC (D21).** | Types partagés par les 3 specs |
| Q17 | L'entrée « Tous les posts » dans la navigation convient-elle pour accéder à la liste des posts ? **Tranché : oui (D26).** | Navigation |
| Q18 | Le calendrier prévoit un affichage mobile, la spec Création de post est desktop uniquement. Que se passe-t-il quand on touche « Créer un nouveau post » sur mobile ? **Tranché : pas de mobile, outil desktop uniquement (D25).** | Cohérence du parcours sur mobile |

---

## 9. Alignement avec les autres specs

Cet écran reste développé à part. Voici ce qu'il lit et ce qu'il ouvre.

| Ce que le calendrier utilise | Source de vérité | Détail |
|---|---|---|
| Posts, statuts, codes, transitions | Spec Création de post | Aucun modèle propre. Les 7 statuts sont affichés (Archivé masqué) |
| Création d'un post | Spec Création de post, E1 et E2 | Bouton flottant, « Rédiger ce post », « Planifier », « Créer un post ce jour », avec préremplissage (voir 3.7) |
| Ouverture d'un post | Spec Création de post, E3 | « Ouvrir le post », clic dans « À venir » |
| Liste complète | Spec Création de post, E6 | Entrée « Tous les posts », lien « Voir tous les posts » |
| Posts publiés passés | Spec Paramétrage, E0 (import) | Posts `origin = linkedin_import` affichés en Publié |
| Objectif de rythme | Spec Paramétrage, `target_frequency` de la ligne | Indicateurs et suggestion « Rythme » |
| Types de post | Spec Paramétrage, gabarits | Suggestions, préremplissage, filtres |
| Lignes éditoriales | Spec Paramétrage | Filtre Marketing / RH, ligne conseillée |
| État de la connexion LinkedIn | Spec Création de post, E7 | Bas de la navigation |
| Espace Paramétrage | Spec Paramétrage, E2 | Entrée « Paramétrage rédaction » |

Première connexion : l'onboarding de la spec Paramétrage (connexion LinkedIn, ligne, charte) s'affiche avant le calendrier. S'il est passé, le calendrier s'ouvre avec le bandeau « Ligne éditoriale non configurée ».
