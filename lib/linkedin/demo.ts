import "server-only"

import type { LinkedInPage, RemotePost } from "./types"

// Données du mode démo (LINKEDIN_CLIENT_ID absent) : pages et posts fictifs, aucune personne
// ni entreprise réelle. Déterministes, pour que le réimport retrouve les mêmes URN.

export const DEMO_PAGES: LinkedInPage[] = [
  { urn: "urn:li:organization:demo-1", name: "Hello Pomelo (démo)", logoUrl: null },
  { urn: "urn:li:organization:demo-2", name: "Hello Pomelo Lab (démo)", logoUrl: null },
]

const DEFAULT_DEMO_POST_COUNT = 42
// Les posts sont répartis sur les 11 derniers mois, dans la limite d'import de 12 mois.
const SPREAD_DAYS = 330
const DAY_MS = 24 * 60 * 60 * 1000

function pick<T>(items: readonly T[], index: number): T {
  return items[index % items.length]
}

const NEWCOMERS = [
  { name: "Camille", role: "consultante data" },
  { name: "Hugo", role: "data engineer" },
  { name: "Inès", role: "cheffe de projet BI" },
  { name: "Malik", role: "analytics engineer" },
  { name: "Nora", role: "consultante BI" },
] as const

const TEMPLATES: ((k: number) => string)[] = [
  // Arrivée d'un collaborateur
  (k) => {
    const { name, role } = pick(NEWCOMERS, k)
    const past = pick(
      [
        "6 ans dans la distribution, à construire les tableaux de bord de 40 magasins",
        "4 ans dans une banque régionale, sur les flux de données réglementaires",
        "5 ans en cabinet, sur des migrations vers le cloud",
        "3 ans dans l'industrie, à fiabiliser les données de production",
      ],
      k + 1
    )
    const detail = pick(
      [
        "Le week-end, direction le mur d'escalade.",
        "Passion du moment : les cartes anciennes, déjà affichées près de son bureau.",
        "Côté communauté : deux ans d'animation d'un meetup dataviz.",
        "Prochain objectif : un premier semi-marathon.",
      ],
      k + 2
    )
    return [
      `${name} rejoint l'équipe comme ${role}.`,
      `Après ${past}, ${name} accompagnera nos clients sur leurs projets de pilotage.`,
      detail,
      `Bienvenue ${name} !`,
    ].join("\n\n")
  },
  // Projet livré
  (k) => {
    const client = pick(
      [
        "un distributeur de 300 personnes",
        "un réseau de 25 agences",
        "un industriel de l'agroalimentaire",
        "une mutuelle régionale",
        "un transporteur de 800 personnes",
      ],
      k
    )
    const before = pick(["3 jours", "une semaine", "la fin du mois", "48 heures"], k + 1)
    const deliverable = pick(
      [
        "un tableau de bord commercial branché sur leur ERP",
        "un entrepôt de données unique pour la finance et les ventes",
        "un suivi quotidien des stocks par site",
        "un portail de reporting pour les directeurs d'agence",
      ],
      k + 2
    )
    const users = pick(["40", "120", "65", "25"], k + 3)
    return [
      `Les équipes d'${client} attendaient leurs chiffres ${before}.`,
      "Elles les reçoivent maintenant chaque matin à 8 h.",
      `Notre équipe a livré ${deliverable}, en 3 lots de deux semaines.`,
      "Le choix décisif : calculer chaque indicateur une seule fois, dans l'entrepôt, plutôt que dans chaque rapport.",
      `${users} utilisateurs s'y connectent chaque jour depuis le premier mois.`,
      "#Data #BusinessIntelligence",
    ].join("\n\n")
  },
  // Événement à venir
  (k) => {
    const city = pick(["Lyon", "Nantes", "Lille", "Bordeaux", "Rennes"], k)
    const topic = pick(
      ["la qualité des données", "les tableaux de bord qui servent vraiment", "la migration vers le cloud", "dbt en production"],
      k + 1
    )
    return [
      `Jeudi prochain, nous organisons un meetup data à ${city}.`,
      `Au programme : deux retours d'expérience sur ${topic}, puis un temps d'échange autour d'un verre.`,
      "L'entrée est libre, les places sont limitées : le lien d'inscription est en commentaire.",
    ].join("\n\n")
  },
  // Recrutement
  (k) => {
    const role = pick(
      [
        "un ou une data engineer",
        "un consultant ou une consultante BI",
        "un ou une analytics engineer",
        "un chef ou une cheffe de projet data",
        "un ou une data analyst",
      ],
      k
    )
    const city = pick(["Lyon", "Paris", "Nantes"], k + 1)
    const size = pick(["8", "12", "6"], k + 2)
    return [
      `Nous recrutons ${role} en CDI à ${city}.`,
      `Vous rejoindrez une équipe de ${size} personnes qui conçoit les plateformes de données de nos clients.`,
      "Nous cherchons 3 ans d'expérience, de l'aisance avec SQL et l'envie d'expliquer vos choix aux métiers.",
      "Pour postuler ou recommander quelqu'un, le lien de l'offre est en commentaire.",
      "#Recrutement #Data",
    ].join("\n\n")
  },
  // Retour d'expérience technique
  (k) => {
    const problem = pick(
      [
        "Des traitements de nuit tombaient sans alerte, et personne ne le voyait avant 10 h.",
        "Un même indicateur donnait trois valeurs différentes selon le rapport consulté.",
        "Une migration d'orchestrateur a doublé le temps de chargement la première semaine.",
        "Un bug de fuseau horaire décalait les ventes du dimanche soir sur le lundi.",
        "Un tableau de bord mettait 40 secondes à s'afficher le lundi matin.",
      ],
      k
    )
    const fix = pick(
      [
        "Nous avons ajouté des tests sur chaque table chargée, exécutés avant la mise à disposition.",
        "Nous avons défini l'indicateur une seule fois, dans le modèle de données, et supprimé les calculs des rapports.",
        "Nous avons découpé les chargements par source et parallélisé les plus longs.",
        "Nous avons stocké toutes les dates en UTC et converti uniquement à l'affichage.",
        "Nous avons préparé les agrégats la nuit au lieu de les calculer à chaque ouverture.",
      ],
      k
    )
    const lesson = pick(
      [
        "tester les données comme on teste du code",
        "une définition partagée vaut mieux que dix rapports rapides",
        "mesurer avant de migrer, pour savoir ce qu'on compare",
        "un fuseau horaire se décide au début du projet, pas à la fin",
        "un calcul fait une fois la nuit coûte moins cher que cent fois le matin",
      ],
      k
    )
    return [problem, fix, `Ce que nous en retenons : ${lesson}.`, "Comment traitez-vous ce cas dans vos équipes ?"].join(
      "\n\n"
    )
  },
  // Vie d'équipe
  (k) => {
    const moment = pick(
      [
        "Vendredi, l'équipe a passé l'après-midi sur un atelier dataviz interne.",
        "Cette semaine, toute l'équipe s'est retrouvée pour notre séminaire de rentrée.",
        "Chaque mardi midi, une personne de l'équipe présente un sujet qui l'intéresse.",
        "Hier, nous avons fêté les 5 ans de l'agence de Lyon.",
        "Ce matin, petit-déjeuner d'équipe pour accueillir les alternants de la rentrée.",
      ],
      k
    )
    const scene = pick(
      [
        "Chacun est reparti avec un graphique refait de zéro à partir d'un vrai jeu de données.",
        "Au programme : bilan de l'année, ateliers en petits groupes et une course d'orientation très disputée.",
        "Cette fois, Léa nous a expliqué comment elle prépare ses ascensions en montagne.",
        "Gâteau, photos d'archives et quelques anecdotes sur les premiers projets.",
      ],
      k + 1
    )
    return [moment, scene, "C'est aussi comme ça que nous apprenons les uns des autres."].join("\n\n")
  },
  // Retour sur un événement
  (k) => {
    const event = pick(
      [
        "un salon de la data",
        "une conférence BI",
        "un webinar sur la gouvernance des données",
        "une journée de conférences sur le cloud",
        "un forum de l'emploi tech",
      ],
      k
    )
    const people = pick(["4", "6", "3"], k + 1)
    return [
      `Retour sur ${event}, où nous étions ${people} de l'équipe.`,
      "Trois idées que nous ramenons : commencer petit, documenter chaque indicateur, et montrer les chiffres aux métiers dès la première semaine.",
      "Merci aux organisateurs et à toutes les personnes rencontrées sur le stand.",
    ].join("\n\n")
  },
  // Projet livré : migration
  (k) => {
    const client = pick(
      [
        "un groupe de distribution",
        "une société de services",
        "un acteur du transport",
        "un réseau de cliniques",
        "un fabricant de mobilier",
      ],
      k
    )
    const tables = pick(["180", "250", "90"], k + 1)
    return [
      `Migration terminée pour ${client} : ${tables} tables déplacées vers le cloud, sans interruption pour les utilisateurs.`,
      "La clé : faire tourner l'ancien et le nouvel entrepôt en parallèle pendant un mois, et comparer chaque matin.",
      "Les écarts ont été corrigés un par un avant la bascule.",
      "#Cloud #Data",
    ].join("\n\n")
  },
  // Marque employeur : un métier
  (k) => {
    const name = pick(["Léa", "Sarah", "Nora", "Inès", "Camille"], k)
    return [
      `À quoi ressemble la journée d'une data engineer ? ${name} nous a ouvert son agenda.`,
      "9 h : point avec le client sur les chargements de la nuit. 11 h : revue de code avec l'équipe. 14 h : atelier avec les métiers pour définir un indicateur.",
      "Moins de code que prévu, plus d'échanges qu'on ne le croit.",
    ].join("\n\n")
  },
]

// Posts fictifs de la page démo, du plus récent au plus ancien.
export function buildDemoPosts(now: Date, count: number = DEFAULT_DEMO_POST_COUNT): RemotePost[] {
  const step = SPREAD_DAYS / Math.max(count, 1)
  return Array.from({ length: count }, (_, i) => {
    const template = TEMPLATES[i % TEMPLATES.length]
    const variant = Math.floor(i / TEMPLATES.length)
    const publishedAt = new Date(now.getTime() - Math.round((i + 0.5) * step * DAY_MS))
    return {
      urn: `urn:li:share:demo-${i}`,
      text: template(variant),
      publishedAt: publishedAt.toISOString(),
      hasImage: i % 3 === 0,
      url: null,
    }
  })
}
