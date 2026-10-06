# Spec : créneaux conseillés à la planification

Oct 6, 2026 · @Tech Lead · alignée avec les specs « Parcours de création d'un post LinkedIn », « Paramétrage rédaction » (v1.2) et « Écran Mon calendrier »

## Points d'attention

La fonctionnalité se résume à un préremplissage du jour et de l'heure, accompagné d'une phrase d'explication. Trois règles la cadrent.

1. **L'outil propose, l'admin décide.** \[Certain\] Aucune date ni heure n'est modifiée sans action de l'admin. Le préremplissage ne touche jamais un champ que l'admin a déjà modifié. Revenir au créneau conseillé passe toujours par un clic.
2. **Toujours expliquer.** \[Certain\] Chaque créneau conseillé est affiché avec sa raison en une phrase. Les créneaux viennent de repères généraux sur LinkedIn ([source](https://swello.com/fr/blog/quand-poster-sur-linkedin/)), pas d'une mesure de la page, et l'écran le dit.
3. **Rien de nouveau côté backend.** \[Likely\] La matrice est une constante du front, les dates partent au backend comme aujourd'hui. Pas de table, pas d'endpoint, pas de calcul serveur.

## Problème et objectifs

Aujourd'hui, l'admin choisit le jour et l'heure de sa série sans repère, et l'outil propose 8 h 30 pour tous les types de post. Le but est de lui proposer d'emblée un créneau adapté au type de post, avec sa raison, sans rallonger le formulaire.

**Périmètre :** le formulaire de série (spec Création de post, E2). L'édition d'un post (E3) et le mode manuel suivent en P1.

### Objectifs

1. Au moins 70 % des séries gardent le jour et l'heure conseillés.
2. La médiane de création reste sous 10 minutes, cible de la spec Création de post.
3. Aucune date modifiée sans action de l'admin.

### Non-objectifs

| Hors périmètre | Pourquoi |
| --- | --- |
| Note ou badge de qualité sur chaque créneau | Ajoute une grille complète et des cas limites, pour un gain faible tant que la page n'a pas de statistiques |
| Déplacement des dates, même en un clic sur toute la série | L'admin garde la main, et le préremplissage place déjà la série sur le bon jour |
| Détection des collisions entre Marketing et RH | Demande de croiser les posts existants. À reconsidérer si le cas se produit |
| Créneaux calculés sur l'engagement de la page | Aucune donnée d'engagement en v1 |
| Suggestions de date dans le calendrier | Spec Écran Mon calendrier |

## Fonctionnement

Quand l'admin choisit un type de post, le jour, l'heure et la date de début se préremplissent depuis la matrice, avec la raison affichée sous les champs. Tout reste modifiable.

### Matrice des créneaux conseillés

&#91;Guessing\] Interprétation des repères de l'article ([source](https://swello.com/fr/blog/quand-poster-sur-linkedin/)) : mardi, mercredi et jeudi en tête, contenus courts tôt le matin, contenus denses à midi, appel à l'action en fin d'après-midi. À valider par les admins Marketing et RH.

| Type de post | Code | Jour | Heure (Paris) | Raison affichée |
| --- | --- | --- | --- | --- |
| Arrivée d'un collaborateur | `newcomer` | Mardi | 8 h 00 | Un post court se lit bien tôt le matin, en début de semaine active. |
| Projet livré | `project_delivered` | Jeudi | 10 h 30 | Le jeudi en fin de matinée est l'un des moments les plus actifs sur LinkedIn. |
| Retour d'expérience technique | `tech_feedback` | Jeudi | 12 h 30 | Un contenu dense se lit plus volontiers à la pause déjeuner. |
| Marque employeur | `employer_brand` | Mercredi | 12 h 30 | Les récits d'équipe se lisent bien à la pause déjeuner. |
| Recrutement | `hiring` | Mardi | 17 h 00 | En fin de journée, les lecteurs répondent plus aux appels à l'action. |
| Événement | `event` | Aucun | 10 h 30 | La date dépend de l'événement. La fin de matinée reste un moment actif. |

Sous chaque raison, une infobulle commune : « Repères généraux d'usage de LinkedIn, pas une mesure de votre page. »

### Comportement du formulaire de série (E2)

1. **Préremplissage au choix du type :** jour et heure prennent les valeurs de la matrice. La date de début devient le prochain jour conseillé, à partir de demain. Pour Événement, seule l'heure est préremplie.
2. **Champ modifié = champ protégé :** dès que l'admin modifie le jour, l'heure ou la date de début, ce champ n'est plus jamais rempli par l'outil, même s'il change de type de post.
3. **Préremplissage depuis le calendrier :** la date transmise par le calendrier est conservée. Seule l'heure vient de la matrice si le calendrier n'en fournit pas.
4. **Information toujours visible :** sous les champs jour et heure, une ligne en texte discret.
   - Valeurs conseillées en place : « Créneau conseillé pour un projet livré : jeudi 10 h 30. \[raison\] »
   - Valeurs modifiées : « Créneau conseillé : jeudi 10 h 30. \[raison\] » suivi du lien « Utiliser ce créneau ».
5. **« Utiliser ce créneau » :** remet le jour et l'heure conseillés, et la date de début au prochain jour conseillé. C'est la seule façon de revenir à la matrice après une modification.

### Fuseau horaire

Les heures sont saisies, affichées et publiées à l'heure de Paris. Le fuseau de l'ordinateur sert seulement à une mention.

- Le champ s'appelle « Heure (Paris) ». Le champ « Fuseau » du formulaire est retiré.
- Si le décalage de l'ordinateur avec Paris diffère à la date de début, une mention s'ajoute : « 10 h 30 à Paris, soit 4 h 30 chez vous. » Ordinateur à Bruxelles ou à Paris : aucune mention.
- La date de publication part au backend en UTC, convertie depuis l'heure de Paris à la date du post. Un post prévu à 8 h 00 après le changement d'heure part bien à 8 h 00 heure de Paris.

## User stories

Persona unique : l'admin Marketing / Comm ou RH qui planifie une série pour la page entreprise.

1. En tant qu'admin, je veux que le jour et l'heure soient préremplis selon le type de post, pour ne pas chercher quand publier.
2. En tant qu'admin, je veux savoir en une phrase pourquoi ce créneau est conseillé, pour décider en connaissance de cause.
3. En tant qu'admin, je veux changer librement le jour et l'heure sans que l'outil les remplace ensuite, pour publier une annonce datée quand elle doit sortir.
4. En tant qu'admin, je veux revenir au créneau conseillé en un clic après l'avoir modifié.
5. En tant qu'admin dont l'ordinateur n'est pas à l'heure française, je veux savoir à quelle heure locale correspond la publication, pour ne pas me tromper d'heure.

## Exigences

Trois exigences P0, toutes dans le front du formulaire de série.

### P0 : indispensable

1. **Préremplissage depuis la matrice**
   - Étant donné un formulaire où l'admin n'a touché ni au jour, ni à l'heure, ni à la date de début, quand il choisit « Projet livré », alors le jour vaut jeudi, l'heure 10 h 30 et la date de début le prochain jeudi à partir de demain.
   - Étant donné un admin qui a modifié l'heure, quand il change de type de post, alors son heure reste inchangée.
   - Étant donné une date transmise par le calendrier, alors cette date est conservée et seule l'heure vient de la matrice.
   - Étant donné le type Événement, alors seule l'heure est préremplie.
   - Aucun champ n'est modifié par l'outil après une saisie de l'admin. Aucune exception.
2. **Raison toujours affichée**
   - Une ligne d'information sous les champs jour et heure affiche le créneau conseillé et sa raison, que les valeurs soient conservées ou modifiées.
   - Quand les valeurs diffèrent de la matrice, le lien « Utiliser ce créneau » apparaît. Il ne s'applique qu'au clic.
   - L'infobulle précise qu'il s'agit de repères généraux, pas d'une mesure de la page.
   - La génération n'est jamais bloquée, quel que soit le créneau choisi.
3. **Heure de Paris**
   - Le champ s'appelle « Heure (Paris) » et le champ « Fuseau » est retiré.
   - Étant donné un ordinateur réglé sur America/Toronto, quand l'admin saisit 10 h 30 pour le 8 octobre, alors le post part à 10 h 30 heure de Paris et la mention « soit 4 h 30 chez vous » s'affiche.
   - Étant donné un ordinateur réglé sur Europe/Brussels, alors aucune mention.
   - Étant donné un post prévu à 8 h 00 le 2 novembre et créé le 6 octobre, alors il part à 8 h 00 heure de Paris.

### P1 : à suivre rapidement

- Même ligne d'information et même lien dans l'édition d'un post (E3) et le mode manuel.
- Mention discrète si une date prévue tombe un week-end ou un jour férié, sans la déplacer. Calcul dans le front, avec une librairie de jours fériés.

### P2 : plus tard

- Matrice ajustable par l'admin dans le paramétrage, par ligne éditoriale.
- Créneaux tirés de l'engagement réel de la page, si les statistiques entrent dans le périmètre.

## Impact technique

Tout se passe dans le front. Le backend reçoit les mêmes données qu'aujourd'hui.

| Côté | Changement |
| --- | --- |
| Front | Un fichier de configuration avec la matrice (code du type, jour, heure, raison). Logique de préremplissage et de champ protégé dans le formulaire E2. Lecture du fuseau du navigateur pour la mention locale |
| Front | Conversion de l'heure de Paris en UTC à la date du post, avec une librairie de dates qui gère les fuseaux |
| Backend | Aucun changement. \[Likely\] Il stocke déjà la date en UTC et le fuseau de la série. Ce fuseau vaut désormais toujours `Europe/Paris` |

&#91;Guessing\] Charge estimée : 1 à 2 jours de dev front. À confirmer avec la stack du repo, non lue.

## Indicateurs, questions et alignement

Deux indicateurs suffisent, calculés après coup en comparant les posts programmés à la matrice, sans champ ajouté.

| Indicateur | Mesure | Seuil de succès | Évaluation |
| --- | --- | --- | --- |
| Créneau conseillé gardé | Séries dont le jour et l'heure du premier post égalent ceux de la matrice / séries générées | 70 % | J+14 |
| Temps de création | Médiane entre ouverture du formulaire et première programmation | 10 min max | J+14 |

&#91;Guessing\] Seuils à recaler après 2 semaines.

### Questions ouvertes

| Question | Qui tranche | Bloquant |
| --- | --- | --- |
| La matrice convient-elle aux admins Marketing et RH ? | Produit + Marketing + RH | Non, modifiable dans le fichier de configuration |
| Le backend stocke-t-il déjà la date en UTC avec le fuseau de la série ? | Tech | Oui, conditionne le « aucun changement backend » |

### Alignement avec les autres specs

| Spec | Ce qui change |
| --- | --- |
| Création de post | E2 : jour, heure et date de début préremplis par la matrice au lieu de 8 h 30. Ligne d'information sous les champs. Champ « Fuseau » retiré, champ « Heure (Paris) ». Même chose dans P0 2 |
| Écran Mon calendrier | 3.7 : la date transmise prime, l'heure vient de la matrice au lieu de 8 h 30 par défaut |
| Paramétrage rédaction | Aucun changement en v1. La matrice pourra rejoindre les gabarits en P2 |
