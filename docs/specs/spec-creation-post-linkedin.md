# Spec : parcours de création d'un post LinkedIn

6 octobre 2026 · @Tech Lead · alignée avec les specs « Paramétrage rédaction » (v1.2) et « Écran Mon calendrier »

## Points d'attention à trancher avant le dev

Le modèle à 4 statuts ne suffit pas pour une publication automatique à date : cette spec ajoute **Programmé** et **Échec**. Les niveaux de confiance sont indiqués entre crochets.

1. **Il manque un statut entre Brouillon et En cours.** \[Certain\] Tel que défini, "En cours" dure le temps de l'appel API, soit quelques secondes. Un post validé qui attend sa date n'a donc aucun statut. Proposition : ajouter **Programmé**.
2. **Il manque un statut d'échec.** \[Certain\] Un appel à LinkedIn peut échouer (token expiré, contenu refusé, panne). Sans statut **Échec**, le post reste bloqué en "En cours" et l'utilisateur croit qu'il part.
3. **Le sujet du post n'est pas dans les paramètres.** \[Certain\] Récurrence, ton, dates et compte ne disent pas à l'IA de quoi parler. Un champ sujet et brief est ajouté en P0.
4. **LinkedIn ne programme rien à notre place.** \[Likely\] L'API publie immédiatement. C'est à notre backend de déclencher la publication à l'heure prévue, via une tâche planifiée.
5. **Profil personnel ou page entreprise change le délai.** \[Likely\] Publier sur un profil personnel passe par le produit "Share on LinkedIn" en libre accès. Publier sur une page entreprise exige l'API Community Management, soumise à validation de LinkedIn. Décision : v1 sur une page LinkedIn de test, puis la page entreprise. \[Likely\] La page de test demande le même accès API que la page entreprise : la demande à LinkedIn est le chemin critique et doit partir dès maintenant. \[Likely\] Le même accès couvre la lecture des posts de la page (`r_organization_social`), utilisée par l'import de l'onboarding (spec Paramétrage rédaction, E0).
6. **Le token LinkedIn expire.** \[Likely\] Les tokens membres durent environ 60 jours et le rafraîchissement automatique est réservé aux partenaires validés. Une série programmée au-delà de cet horizon échouera sans reconnexion. Proposition : limiter l'horizon d'une série à 60 jours et prévenir avant expiration.
7. **La spec ne tient pas compte du code existant.** \[Certain\] Le repo est privé et n'a pas pu être lu. Le modèle de données et la stack restent à confronter.

## Problème et contexte

Publier régulièrement sur LinkedIn demande de trouver des idées, rédiger et penser à publier à heure fixe. La plupart des gens tiennent quelques semaines puis s'arrêtent, faute de temps plus que d'idées.

Le parcours permet de définir une fois les règles de rédaction, de laisser l'IA produire une série complète de posts, de les relire et corriger, puis de les laisser partir seuls à date.

**Cible validée :** un admin Marketing / Comm ou RH qui publie au nom de l'entreprise, d'abord sur une page LinkedIn de test, puis sur la page entreprise. Chaque admin est rattaché à une ligne éditoriale (Marketing ou RH).

## Objectifs et non-objectifs

### Objectifs

1. **Aller vite :** passer des paramètres à une série de 4 posts programmés en moins de 10 minutes.
2. **Produire des posts utilisables :** au moins 70 % des posts générés sont programmés sans réécriture complète.
3. **Publier de façon fiable :** au moins 98 % des posts programmés sont publiés à l'heure, hors token expiré.
4. **Zéro doublon :** aucun post publié deux fois sur LinkedIn.

### Non-objectifs (v1)

| Hors périmètre | Pourquoi |
| --- | --- |
| Statut "En relecture" | Prévu en P1 (décision D14 de la spec Paramétrage). Le modèle de statuts doit pouvoir l'accueillir dès la v1 |
| Publication sur un profil personnel | La v1 publie uniquement sur une page (test puis entreprise) |
| Plusieurs images, vidéos, carrousels, documents | Envoi plus lourd que l'image seule, prévu en P1 juste après le MVP |
| Modifier ou supprimer un post déjà publié sur LinkedIn | Archiver dans l'app ne touche jamais LinkedIn |
| Statistiques d'engagement | Autre initiative, nécessite d'autres droits API |
| Autres réseaux sociaux | Le parcours doit d'abord marcher sur un réseau |

Le paramétrage de la rédaction (charte, ligne éditoriale, voix, gabarits, assemblage du prompt, garde-fous) est hors de cette spec. Il est traité dans la spec Paramétrage rédaction (`spec-parametrage-redaction.md`), que ce parcours consomme sans la redéfinir. La connexion LinkedIn est partagée : elle est proposée à l'onboarding (Paramétrage, E0) et gérée ici (E7).

La vue calendrier est traitée dans la spec Écran Mon calendrier (`spec-ecran-mon-calendrier.md`), qui est l'écran d'accueil de l'outil. Cette spec couvre la création, l'édition, la liste des posts (E6) et la publication. Le calendrier ouvre ses écrans (voir section « Alignement avec les autres specs »).

## Parcours utilisateur de bout en bout

L'auteur intervient sur 5 étapes, le système fait la génération et la publication. Un échec ramène le post à l'édition pour être reprogrammé.

```
1. Connecter LinkedIn (une fois, ou fait à l'onboarding)
2. Définir les paramètres (sujet, ligne, type, rythme, dates)
3. Vérifier les dates (nombre de posts calculé)
4. Générer la série (système)
5. Relire et éditer chaque post
6. Programmer un post ou les posts validés
7. Publier à date (système) ──> Publié, ou Échec ──> retour en 5 pour reprogrammer
```

L'étape 3 est un garde-fou : l'auteur voit combien de posts seront générés avant de lancer l'IA, ce qui évite une série de 40 posts par erreur de date.

**Parcours manuel :** l'auteur saute les étapes 2 à 4. Il écrit un post seul, puis le programme et le système le publie comme un post généré.

## Cycle de vie et statuts du post

Six statuts en v1 : Brouillon, Programmé, En cours, Publié, Échec et Archivé. L'auteur déclenche les transitions de gauche, le système celles qui partent de Programmé.

**En cours est un statut technique.** Il dure le temps de l'appel à LinkedIn, quelques secondes. Il sert à deux choses : empêcher qu'un post soit publié deux fois, et repérer un post resté bloqué (résultat incertain). L'auteur ne le voit qu'exceptionnellement, affiché "Publication en cours".

**Le go manuel est le passage de Brouillon à Programmé.** Un post rédigé, par l'IA ou à la main, arrive toujours en Brouillon et n'en sort que sur une action de l'auteur (Programmer ce post, ou Programmer les posts validés). Dans le tableau et la frise, un Brouillon pas encore validé s'affiche "À relire".

Codes des statuts, communs aux 3 specs :

| Statut | Code | Disponible |
| --- | --- | --- |
| Brouillon | `draft` | v1 |
| En relecture | `pending` | P1 |
| Programmé | `scheduled` | v1 |
| En cours | `publishing` | v1 |
| Publié | `published` | v1 |
| Échec | `failed` | v1 |
| Archivé | `archived` | v1 |

Le statut En relecture (P1) s'insèrera entre Brouillon et Programmé sans toucher au reste, à condition de stocker les transitions dans une table plutôt qu'en dur dans le code.

Les posts importés depuis la page LinkedIn à l'onboarding (champ `origin = linkedin_import`) sont créés directement en Publié, en lecture seule. Ils ne passent par aucune transition.

### Transitions recommandées

| De | Vers | Déclencheur | Condition |
| --- | --- | --- | --- |
| (génération IA ou création manuelle) | Brouillon | Système | Post généré sans erreur, ou créé à la main |
| Brouillon | Programmé | Auteur | Post validé par l'auteur, compte lié, token valide à la date, date future, texte non vide, aucun garde-fou bloquant |
| Programmé | Brouillon | Auteur | Avant le passage en En cours |
| Programmé | En cours | Système | Date atteinte, verrou pris sur le post |
| En cours | Publié | Système | LinkedIn confirme la création du post |
| En cours | Échec | Système | Erreur LinkedIn, plus de 10 min sans réponse, ou garde-fou bloquant au contrôle de publication (client devenu non citable) |
| Échec | Programmé | Auteur | Nouvelle date future, token valide |
| Brouillon, Programmé, Échec, Publié | Archivé | Auteur | Jamais depuis En cours |
| Archivé | Brouillon ou Publié | Auteur | Publié si le post a déjà été publié, sinon Brouillon |

Toute transition absente de ce tableau est refusée par le backend.

Transitions ajoutées en P1 (relecture) :

| De | Vers | Déclencheur | Condition |
| --- | --- | --- | --- |
| Brouillon | En relecture | Auteur | Post validé par l'auteur, mêmes conditions que la programmation |
| En relecture | Programmé | Admin relecteur | Relecture acceptée. Un admin peut valider ses propres posts |
| En relecture | Brouillon | Admin relecteur | Relecture refusée, avec un motif affiché à l'auteur |

En P1, la transition Brouillon vers Programmé disparaît : tout post passe par En relecture.

## Écrans (desktop uniquement)

Sept écrans couvrent le parcours. Aucun post ne part sans validation manuelle de l'auteur. Le calendrier est traité dans une autre US et n'apparaît pas ici. Les composants sont nommés de façon générique, à rapprocher du design system par l'équipe.

### E1. Nouveau post (modale)

- **Accès :** bouton "Nouveau post" en tête de la liste des posts (E6), et depuis le calendrier : bouton flottant "Créer un nouveau post", "Rédiger ce post" (suggestion), "Planifier" (idée), "Créer un post ce jour" (vue jour).
- **Préremplissage depuis le calendrier :** la date choisie devient la date de début, le sujet de la suggestion ou de l'idée devient le sujet, le type conseillé devient le type de post. Une suggestion de motif Recrutement préremplit la ligne RH.
- **Contenu :** deux choix. "Générer avec l'IA" (une série, de 1 à 20 posts) ouvre E2. "Écrire moi-même" (un post) crée un Brouillon vide et ouvre E3 en mode manuel.
- **État sans page connectée :** bandeau "Connectez la page LinkedIn pour pouvoir programmer" avec un lien vers E7. La création reste possible.
- **État sans ligne éditoriale configurée :** bandeau "Ligne éditoriale non configurée" avec un lien vers le paramétrage. La ligne Neutre s'applique.

### E2. Paramètres de la série

- **Contenu :** sujet et brief (zone de texte), ligne éditoriale (Marketing ou RH, par défaut celle de l'admin, Neutre si aucune n'est configurée), type de post (6 gabarits de la spec Paramétrage, D21 : arrivée d'un collaborateur, projet livré, retour d'expérience technique, événement, marque employeur, recrutement), bloc replié "Réglages du post" prérempli par la ligne éditoriale et le gabarit (ton, longueur, emojis, hashtags, appel à l'action), fréquence, jour, heure (8 h 30 par défaut), fuseau, date de début, date de fin ou nombre de posts. Un nombre de posts égal à 1 masque la fréquence et la date de fin.
- **Panneau latéral "Dates prévues" :** nombre de posts et liste des dates, recalculés à chaque changement.
- **Actions :** Générer, Annuler. Générer reste désactivé tant que le sujet est vide ou qu'un champ est en erreur.
- **Erreurs :** affichées sous le champ concerné (date passée, plafond dépassé). Un client non citable détecté dans le brief bloque la génération avant tout appel à l'IA.

### E3. Relecture et édition (un post à la fois)

- **Frise de navigation en haut :** un repère par post de la série, avec sa date et son état (en cours d'écriture, à relire, validé, programmé, en échec). Clic sur un repère pour aller au post. Absente en mode manuel.
- **Éditeur du post courant :** date et heure modifiables, texte avec compteur sur 3000 caractères, image (ajouter, remplacer, retirer, texte alternatif), badge de statut, motif affiché si le post est en Échec, lien vers LinkedIn s'il est Publié.
- **Actions :** Précédent, Suivant, Aperçu (ouvre E4), Valider, Programmer ce post, Programmer les posts validés (ouvre E5), Déprogrammer, Archiver.
- **Validation :** "Valider" marque le post comme relu par l'auteur, sans changer son statut. "Programmer ce post" valide et programme en une action. Régénérer un post retire sa validation.
- **Génération au fil de l'eau :** les posts apparaissent un par un dans la frise. Un post pas encore écrit s'affiche en squelette avec "En cours d'écriture". Un post dont la génération échoue affiche son repère en erreur et un bouton Relancer.
- **Sauvegarde :** automatique, avec un indicateur "Enregistré" discret.
- **Lecture seule :** en En cours, Publié et Archivé, champs grisés et actions d'édition masquées.

### E4. Aperçu (modale)

- **Contenu :** rendu indicatif du post sur la page : nom et logo de la page, texte coupé au "voir plus" \[Likely : vers 210 caractères\], image.
- **Actions :** Voir plus (déplie le texte), Fermer.
- **Mention :** "Rendu indicatif, l'affichage réel dépend de LinkedIn."

### E5. Programmer les posts validés (modale de récapitulatif)

- **Contenu :** liste des posts validés qui seront programmés, avec date et heure. Nombre de posts exclus, avec leur motif : non validé, garde-fou bloquant, token expiré avant la date.
- **Actions :** Confirmer, Annuler.
- **Succès :** toast "N posts programmés" et retour à E3.

### E6. Liste des posts (tableau)

- **Colonnes :** date et heure de publication, statut (badge), extrait du texte, série (nom ou "Post seul"), présence d'une image.
- **Tri par défaut :** prochaines publications en haut. Filtre par statut. Archivés masqués par défaut.
- **Accès :** entrée "Tous les posts" de la navigation latérale (D26), et lien "Voir tous les posts" de l'onglet "À venir" du calendrier.
- **Périmètre :** tous les posts de la page, quel que soit l'admin qui les a créés (D27). Filtre par ligne éditoriale (Marketing, RH) en plus du filtre par statut. Colonne "Ligne" ajoutée.
- **Posts importés :** les posts récupérés à l'onboarding apparaissent en Publié, série "Importé de LinkedIn", en lecture seule.
- **Action :** clic sur une ligne ouvre le post dans E3. Pas d'action rapide dans la ligne.
- **Vide :** "Aucun post pour l'instant" et bouton "Nouveau post".
- **Échecs :** bandeau en haut du tableau "N posts n'ont pas pu être publiés" avec un filtre direct sur Échec.

### E7. Connexion de la page LinkedIn (réglages)

- **Même connexion que l'onboarding :** l'étape 0 de l'onboarding (spec Paramétrage, E0) crée cette connexion. E7 permet de la gérer ensuite, depuis l'onglet "Connexion LinkedIn" du paramétrage.
- **Contenu :** état de la connexion (non connectée, connectée, expire le JJ/MM, expirée), page cible, compte administrateur utilisé, date du dernier import de posts.
- **Actions :** Connecter, Changer de page, Reconnecter, Réimporter les posts, Déconnecter.
- **Confirmation avant déconnexion :** "N posts programmés ne pourront pas être publiés tant qu'une page n'est pas reconnectée."
- **Erreurs :** connexion refusée sur LinkedIn, compte qui n'administre aucune page.

### Messages à afficher

| Situation | Écran | Message |
| --- | --- | --- |
| Série trop longue | E2 | Une série est limitée à 20 posts sur 60 jours. Revenez plus tard pour programmer la suite. |
| Date de début passée | E2 | Choisissez une date de début à venir. |
| Client non citable | E2, E3 | Ce texte cite un client non citable : \[nom\]. Retirez-le pour continuer. |
| Post non validé | E5 | Non validé : ouvrez et validez ce post pour le programmer. |
| Token expiré avant la date | E3, E5, E7 | La connexion à LinkedIn expire avant cette date. Reconnectez la page. |
| Image refusée | E3 | LinkedIn a refusé l'image. Remplacez-la puis reprogrammez le post. |
| Résultat incertain | E3, E6 | Nous ne savons pas si ce post a été publié. Vérifiez sur LinkedIn avant de le reprogrammer. |
| Aucune page administrée | E7 | Ce compte LinkedIn n'administre aucune page. |
| Ligne non configurée | E1, E2 | Ligne éditoriale non configurée. Les posts utiliseront un ton neutre. |
| Aucun client déclaré | E3, E5 | Aucun client déclaré dans la charte : les noms de clients ne sont pas vérifiés. |
| Garde-fou à la publication | E3, E6 | Ce post n'a pas été publié : il cite un client devenu non citable. |

## User stories

Persona unique en v1 : l'auteur, admin de l'outil rattaché à la ligne Marketing / Comm ou RH, qui publie au nom de l'entreprise sur la page LinkedIn. Classées par priorité.

**Paramétrage**

1. En tant qu'auteur, je veux connecter la page LinkedIn une fois pour que les posts partent sans action de ma part.
2. En tant qu'auteur, je veux décrire le sujet, choisir la ligne éditoriale (Marketing ou RH), le ton et le rythme de ma série pour que l'IA écrive dans la bonne voix.
3. En tant qu'auteur, je veux choisir une date de début, une fréquence et une date de fin pour savoir exactement combien de posts seront produits.

**Génération et édition**

4. En tant qu'auteur, je veux obtenir toute la série en une fois pour voir l'ensemble avant de m'engager.
5. En tant qu'auteur, je veux modifier le texte et la date de chaque post pour garder la main sur ce qui part au nom de l'entreprise.
6. En tant qu'auteur, je veux régénérer un seul post qui ne me plaît pas sans toucher aux autres.

**Publication et suivi**

7. En tant qu'auteur, je veux programmer un post ou toute la série en une action pour ne pas valider post par post.
8. En tant qu'auteur, je veux voir le statut de chaque post pour savoir ce qui est parti, ce qui attend et ce qui a échoué.
9. En tant qu'auteur, je veux être prévenu quand une publication échoue et savoir comment la relancer.
10. En tant qu'auteur, je veux archiver un post pour l'écarter de ma liste sans le perdre.

**Cas limites**

11. En tant qu'auteur dont le token LinkedIn a expiré, je veux être averti avant mes prochaines publications pour me reconnecter à temps.
12. En tant qu'auteur, je veux pouvoir déprogrammer un post tant qu'il n'est pas en cours de publication.

13) En tant qu'auteur, je veux écrire un post moi-même, sans IA, pour publier un contenu déjà prêt avec le même circuit de programmation.

## Exigences

Dix exigences P0 forment le minimum livrable. Les seuils chiffrés marqués \[Guessing\] sont des propositions à valider.

### P0 : indispensable

1. **Connexion de la page LinkedIn**
   - Connexion par OAuth d'un administrateur de la page, avec le droit de publier au nom de l'organisation. L'auteur choisit la page cible parmi celles qu'il administre. Passer de la page de test à la page entreprise est un réglage, sans changement de code.
   - Étant donné un auteur sans compte lié, quand il programme un post, alors il est envoyé vers la connexion et le post reste en Brouillon.
   - Le token est chiffré en base et n'est jamais renvoyé au navigateur.
   - La date d'expiration du token est stockée et visible dans les réglages.
   - La connexion peut être faite dès l'onboarding (spec Paramétrage, E0). Elle déclenche alors l'import des posts de la page. Il n'existe qu'une seule connexion par page.
2. **Formulaire de paramètres de rédaction**
   - Champs : page LinkedIn cible, sujet et brief (obligatoire), ligne éditoriale (Marketing ou RH, défaut : celle de l'admin), type de post (gabarit, liste fournie par la spec Paramétrage), réglages du post (ton, longueur, emojis, hashtags, appel à l'action) préremplis par la ligne éditoriale et le gabarit et modifiables pour la série, fréquence (quotidienne en jours ouvrés, hebdomadaire, toutes les 2 semaines, mensuelle), jour et heure de publication, date de début, date de fin ou nombre de posts.
   - Fuseau horaire Europe/Paris et heure 8 h 30 par défaut, modifiables.
   - Une série peut contenir un seul post (arrivée d'un collaborateur, projet livré). Dans ce cas, la fréquence et la date de fin sont masquées.
   - Les champs peuvent arriver préremplis depuis le calendrier (date, sujet, type, ligne).
   - Avant génération, l'écran affiche le nombre de posts et la liste des dates calculées.
   - Refus avec message si la date de début est passée, si la série dépasse 20 posts ou 60 jours (validé). Message : "Une série est limitée à 20 posts sur 60 jours. Revenez plus tard pour programmer la suite."
   - Le bouton Générer reste désactivé tant que le sujet est vide.
3. **Génération de la série complète**
   - Une génération produit un post par date calculée, chacun en Brouillon et rattaché à sa date.
   - Chaque post fait au plus 3000 caractères \[Likely : limite LinkedIn\].
   - Deux posts d'une même série ne traitent pas le même angle. L'IA établit d'abord un plan d'angles, puis rédige chaque post.
   - Les paramètres et la version de ligne éditoriale active sont figés sur la série au moment de la génération. L'assemblage du prompt et le contrôle des garde-fous suivent la spec Paramétrage rédaction.
   - En cas d'échec partiel, les posts réussis sont conservés et les emplacements manquants proposent une relance.
4. **Édition d'un post**
   - Texte et date modifiables en Brouillon, Programmé et Échec. Lecture seule en En cours, Publié et Archivé.
   - Compteur de caractères visible, saisie bloquée au-delà de 3000.
   - Texte brut : retours à la ligne, emojis et hashtags conservés, pas de mise en forme riche \[Likely : LinkedIn n'interprète pas le markdown\].
   - Sauvegarde automatique, sans bouton Enregistrer.
   - Modifier la date d'un post Programmé le garde Programmé à la nouvelle date. Une date passée est refusée.
5. **Gestion des statuts**
   - Six statuts : Brouillon, Programmé, En cours, Publié, Échec, Archivé.
   - Seules les transitions du schéma ci-dessus sont acceptées. Le backend refuse toutes les autres, quel que soit le client.
   - Chaque post affiche son statut. La liste se filtre par statut et masque les archivés par défaut.
6. **Programmation**
   - Programmer un post seul, ou tous les posts validés d'une série en une action. Un post que l'auteur n'a pas validé n'est jamais programmé.
   - Conditions : compte lié, token valide à la date du post, date future, texte non vide, aucun garde-fou bloquant (client non citable). Un post qui ne remplit pas une condition reste en Brouillon avec le motif affiché.
   - Si la charte ne contient aucun client, l'avertissement "Aucun client déclaré" s'affiche, sans bloquer.
   - Déprogrammer ramène le post en Brouillon tant qu'il n'est pas En cours.
7. **Publication automatique à date**
   - Une tâche planifiée tourne chaque minute et traite les posts Programmé dont la date est atteinte.
   - Le passage en En cours est atomique : deux exécutions simultanées ne peuvent pas prendre le même post.
   - Juste avant l'appel à LinkedIn, le contrôle de la charte est relancé avec la charte active. Un client devenu non citable fait passer le post en Échec, motif "garde-fou", sans appel à LinkedIn.
   - Succès : le post passe Publié, avec l'identifiant LinkedIn, le lien et l'heure réelle de publication.
   - Erreur : le post passe Échec avec un motif lisible (token expiré, contenu refusé, erreur LinkedIn) et l'auteur reçoit une notification dans l'app.
   - Un post resté En cours plus de 10 minutes \[Guessing\] passe Échec avec le motif "résultat incertain, vérifier sur LinkedIn". Pas de relance automatique dans ce cas, pour éviter un doublon.
   - Écart maximal entre l'heure prévue et la publication : 5 minutes \[Guessing\].
8. **Archivage**
   - Possible depuis tous les statuts sauf En cours.
   - Archiver un post Programmé annule sa publication.
   - Restaurer un post archivé : un post Publié redevient Publié, tous les autres reviennent en Brouillon.
   - Archiver ne supprime rien sur LinkedIn.
9. **Image attachée au post**
   - L'auteur ajoute une image (JPG, PNG ou GIF) à un post en Brouillon, Programmé ou Échec.
   - Format et poids vérifiés à l'ajout, jamais au moment de la publication.
   - Texte alternatif obligatoire, prérempli par l'IA, modifiable.
   - L'aperçu montre le post avec son image.
   - À la publication, l'image est envoyée à LinkedIn avant le post \[Likely : l'API demande d'envoyer le média puis de le référencer\]. Si cet envoi échoue, le post passe Échec avec le motif "image refusée".
   - Hypothèse : l'auteur fournit l'image. La génération d'images par IA reste hors MVP.
   - Hors MVP, en P1 juste après : plusieurs images par post, vidéo, document PDF (carrousel).
10. **Création manuelle, sans IA**
    - À l'entrée du parcours, l'auteur choisit "Écrire moi-même" ou "Générer avec l'IA".
    - Le mode manuel crée un seul post en Brouillon, sans série ni récurrence. La date reste facultative jusqu'à la programmation.
    - Aucun appel au modèle d'IA dans ce mode. Le texte alternatif de l'image est saisi par l'auteur.
    - Le post manuel suit exactement les mêmes règles qu'un post généré : édition, image, statuts, programmation, publication.
    - Les garde-fous de la charte s'appliquent aussi : le contrôle est fait par du code, sans IA, et un client non citable bloque la programmation.
    - Hors MVP, en P1 : aide IA ponctuelle sur un post manuel (reformuler, raccourcir, proposer une accroche).

### P1 : à suivre rapidement

- **Statut En relecture** entre Brouillon et Programmé. Un admin relit et valide tous les posts, les siens compris. Un refus renvoie le post en Brouillon avec un motif. Écran "Posts à valider" dans la navigation du calendrier.
- **Régénérer un post avec une consigne** ("plus court", "ajoute un exemple") sans toucher au reste de la série.
- **Gabarit par post :** changer le type de post d'un seul post de la série et le régénérer.
- **Relance automatique** des erreurs temporaires (panne LinkedIn, limite de débit) : 3 essais espacés, uniquement quand LinkedIn confirme que rien n'a été publié.
- **Alerte d'expiration du token** 7 jours avant, si des posts sont programmés après cette date.
- **Notification par email** en cas d'échec.
- **Aperçu façon LinkedIn (passé en P0, écran E4)** avec la coupure "voir plus".
- **Modifier les paramètres d'une série** et régénérer uniquement ses brouillons restants. Les posts Programmé, Publié et Archivé ne bougent pas.

### P2 : à prévoir dans l'architecture

- **Machine à états :** modéliser les statuts avec une table de transitions dès la v1, pas comme des booléens, pour accueillir En relecture en P1.
- **Profils personnels :** traiter la page liée comme une "cible de publication" typée (profil ou page) dès la v1.
- **Images générées par IA pour illustrer** un post.
- **Plusieurs réseaux :** séparer le contenu du post de sa publication, une publication par cible.

## Indicateurs de succès

Toutes les cibles sont des hypothèses de départ \[Guessing\], à recaler après 2 semaines de données réelles.

| Indicateur | Type | Mesure | Seuil de succès | Cible ambitieuse | Évaluation |
| --- | --- | --- | --- | --- | --- |
| Complétion du parcours | Avancé | Séries avec au moins 1 post programmé / séries commencées | 60 % | 80 % | J+14 |
| Temps de création | Avancé | Médiane entre ouverture du formulaire et première programmation | 10 min | 5 min | J+14 |
| Posts gardés sans réécriture | Avancé | Posts programmés dont moins de 50 % du texte a changé / posts générés | 70 % | 85 % | J+14 |
| Fiabilité de publication | Avancé | Posts Publié / posts arrivés à date, hors token expiré | 98 % | 99,5 % | Continu |
| Doublons | Garde-fou | Posts publiés deux fois sur LinkedIn | 0 | 0 | Continu |
| Régularité | Retardé | Auteurs ayant publié au moins 4 posts sur 30 jours / auteurs actifs | 40 % | 60 % | J+30 |
| Rétention | Retardé | Auteurs créant une 2e série dans les 45 jours | 30 % | 50 % | J+45 |

## Questions ouvertes et phasage

Deux questions bloquent le démarrage du dev, les autres se règlent en cours de route.

| Question | Qui tranche | Bloquant |
| --- | --- | --- |
| Accès à l'API Community Management demandé et obtenu pour la page de test ? Il conditionne aussi l'import des posts à l'onboarding. | Produit + Tech | Oui |
| Qui administre la page de test et la page entreprise, et peut les connecter ? Réponse : Estelle, pour l'instant. | Produit | Non (tranché) |
| Quelle stack et quel modèle de données existent déjà dans le repo ? | Tech | Oui |
| Plafond de série (20 posts, 60 jours) acceptable pour les utilisateurs ? Réponse : oui, validé. | Produit | Non |
| Quel modèle d'IA, et quel coût par série de 20 posts ? Réponse : Claude, via l'API Anthropic (D10). Coût à mesurer. | Tech | Non (modèle tranché) |
| La spec Paramétrage prévoit une voix auteur (Mon style) : sert-elle encore si la v1 publie uniquement sur une page ? Réponse : non, Mon style passe en P2. | Produit | Non (tranché) |
| Notification in-app seule en v1, ou email dès le départ ? | Produit | Non |
| Quelle date limite (démo de hackathon, lancement) ? | Équipe | Non |

### Phasage proposé

1. **Phase 1 :** connexion LinkedIn, paramètres, génération, édition, statuts et publication automatique (P0 1 à 7), l'image (P0 9) et la création manuelle (P0 10). C'est le parcours démontrable de bout en bout.
2. **Phase 2 :** archivage (P0 8), statut En relecture (P1), régénération ciblée, alertes token, relance automatique.
3. **Phase 3 :** passage sur la page entreprise, images générées par IA, profils personnels (P2).

Si le délai est un hackathon, l'archivage peut glisser en phase 2 sans casser le parcours principal.

## Alignement avec les autres specs

Cette spec reste autonome. Voici ce qu'elle consomme des deux autres et ce qu'elle leur fournit.

| Sujet | Source de vérité | Ce que cette spec en fait |
| --- | --- | --- |
| Connexion LinkedIn et import des posts | Paramétrage (E0) pour l'onboarding, cette spec (E7) pour la gestion | Une seule connexion par page. Les posts importés apparaissent en Publié, lecture seule |
| Ligne éditoriale, charte, gabarits | Paramétrage | Champs "Ligne éditoriale" et "Type de post" de E2, contrôles de la charte |
| Assemblage du prompt et garde-fous | Paramétrage (section 5) | Appelés à la génération, à l'édition, à la programmation et à la publication |
| Statuts et codes | Cette spec | Repris tels quels par le calendrier |
| Liste des posts (E6) | Cette spec | Ouverte depuis la navigation "Tous les posts" et depuis le calendrier |
| Points d'entrée de la création | Calendrier | Bouton flottant, "Rédiger ce post", "Planifier", "Créer un post ce jour" ouvrent E1 avec préremplissage |
| Écran "Posts à valider" (P1) | Calendrier (navigation) | Liste des posts En relecture, ouvre E3 |

Décisions de la spec Paramétrage reprises ici : D4 (lignes Marketing et RH), D10 (Claude), D11 (contrôle à la publication), D13 (ligne Neutre si paramétrage passé), D14 (En relecture en P1), D17 (avertissement sans client), D18 (série d'un seul post), D20 (connexion à l'onboarding), D21 (6 types de post), D23 (import de 50 posts), D25 (desktop uniquement), D26 (entrée "Tous les posts"), D27 (tous les posts visibles, filtre par ligne).
