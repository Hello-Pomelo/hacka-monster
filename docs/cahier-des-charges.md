# Cahier des charges : outil interne de création de posts LinkedIn

Mise à jour : 2026-10-06 · Version : 1 · Hackathon IA 2026

## Contexte

L'outil sert à publier plus souvent sur LinkedIn, avec un ton cohérent entre toutes les publications. Publier doit être facile, rapide et accessible.

| Enjeu | Objectif |
|---|---|
| Notoriété | Gagner en visibilité en prenant la parole plus souvent sur LinkedIn |
| Marque employeur | Montrer la réalité des métiers et des équipes pour donner envie de rejoindre l'entreprise |
| Régularité | Faire vivre les publications dans la durée |

Référence : [Lyter](https://lyter.ai), outil de production de posts LinkedIn par IA (idées de posts, questions guidées, rédaction dans le style de l'auteur, visuels, programmation).

## Concept

L'outil joue le rôle d'un community manager virtuel. L'utilisateur paramètre un post et l'IA produit un texte prêt à publier, dans le ton de l'entreprise.

Le post est l'objet central : l'utilisateur le paramètre, l'IA le rédige, l'utilisateur le relit, l'ajuste puis le valide.

## Utilisateurs

| Rôle | Qui | Droits |
|---|---|---|
| Auteur | Marketing, recrutement / RH | Crée, modifie et valide ses posts |
| Relecteur | Équipe communication / marketing | Relit et valide les posts destinés à la page entreprise |

Un post est publié depuis le compte personnel du collaborateur ou depuis la page entreprise. Seuls les posts de la page entreprise passent par la relecture.

## Fonctionnalités

### F1. Paramétrage d'un post

L'utilisateur crée un post et définit :

| Élément | Contenu |
|---|---|
| Type | Marque employeur, projet livré, retour d'expérience technique, événement, arrivée d'un collaborateur |
| Matière | Réponses à quelques questions guidées, propres au type |
| Paramètres de rédaction | Ton, longueur, emojis, hashtags, appel à l'action |
| Diffusion | Date de diffusion dans un calendrier |

Les réponses sont acceptées en vrac : notes, phrases incomplètes, fautes. L'IA les met en forme.

### F2. Ligne éditoriale

La ligne éditoriale définit le ton de l'entreprise. Elle est réutilisée à chaque génération.

### F3. Génération du post

L'IA rédige une proposition à partir des paramètres. Le texte respecte les codes de LinkedIn : accroche, structure aérée, appel à l'action.

### F4. Relecture et ajustement

L'utilisateur garde la main sur le texte. Il peut :

- modifier le texte directement ;
- demander une nouvelle variante ;
- afficher un aperçu du post tel qu'il apparaîtra sur LinkedIn.

### F5. Validation et statuts

L'utilisateur valide le post une fois satisfait. Chaque post porte un statut :

```
brouillon → en_relecture (page entreprise uniquement) → valide → publie
```

### F6. Vue relecteur

La vue relecteur affiche :

- les posts en préparation ;
- les collaborateurs qui les ont préparés ;
- le statut de chaque post.

### F7. Historique

Chaque utilisateur retrouve les posts qu'il a préparés, avec leur statut. Un post non validé reste modifiable.

## Parcours utilisateur

Six étapes, avec une boucle de régénération tant que le post ne convient pas :

```
Choisir un type de post → Répondre aux questions → Régler les paramètres → Générer → Ajuster → Valider
                                                                              ↑          │
                                                                              └ régénérer┘
```

Le parcours central reste très simple : un écran par étape, sans détour.

## MVP Hackathon

| Fonctionnalité | Réf. | MVP |
|---|---|---|
| Création d'un post et choix de son type | F1 | Oui |
| Questions guidées pour renseigner la matière | F1 | Oui |
| Paramètres de rédaction | F1 | Oui |
| Génération du post par l'IA, selon la ligne éditoriale | F2, F3 | Oui |
| Modification du texte et régénération d'une variante | F4 | Oui |
| Aperçu au format LinkedIn | F4 | Oui |
| Validation et suivi du statut | F5 | Oui |
| Historique des posts de l'utilisateur | F7 | Oui |
| Vue relecteur | F6 | Non exigé |
| Date de diffusion (calendrier) | F1 | Non exigé |
| Publication programmée via le compte LinkedIn | F3 | Non |

> **Remarque :** la publication réelle demande la validation d'une application par l'API LinkedIn. Dans le MVP, « Publier » passe le post au statut `publie` et copie le texte.

*Question ouverte : le statut `en_relecture` est absent de l'exemple de la source (Brouillon → Validé → Publié). Il est ajouté pour porter la relecture des posts de la page entreprise ; à confirmer avec le marketing.*
