// Styles de départ (E1, étape 2, sans posts importés) et matière fixe du post de test (E1, étape 5).
// Données fictives uniquement. Utilisable côté serveur et client.

import type { PostParams, PostTypeId } from "@/lib/post-types"

export type StarterStyleId = "expert_sobre" | "chaleureux" | "direct"

export type StarterStyle = {
  id: StarterStyleId
  label: string
  description: string
  voice_adjectives: string[]
  we_are: string[]
  we_are_not: string[]
  defaults: PostParams
  examplePost: string
}

export const STARTER_STYLES: StarterStyle[] = [
  {
    id: "expert_sobre",
    label: "Expert sobre",
    description: "Des faits, des chiffres, aucune emphase. L'expertise se montre par le détail.",
    voice_adjectives: ["précis", "factuel", "posé"],
    we_are: ["concrets", "pédagogues", "exigeants sur les chiffres"],
    we_are_not: ["vendeurs", "grandiloquents", "jargonneux"],
    defaults: { tone: "professional", length: "medium", emojis: false, hashtags: true, cta: "" },
    examplePost: [
      "Un indicateur, trois valeurs : c'est ce que trouvaient les équipes commerciales d'un distributeur de 300 personnes.",
      "Chaque rapport recalculait le chiffre d'affaires à sa façon.",
      "Nous avons défini l'indicateur une seule fois, dans l'entrepôt de données, et retiré les calculs des rapports.",
      "Résultat : un seul chiffre, disponible chaque matin à 8 h, utilisé par 40 commerciaux.",
      "#Data #BusinessIntelligence",
    ].join("\n\n"),
  },
  {
    id: "chaleureux",
    label: "Chaleureux",
    description: "Des personnes et des moments d'équipe. Le ton d'une conversation entre collègues.",
    voice_adjectives: ["chaleureux", "sincère", "enthousiaste"],
    we_are: ["proches de nos équipes", "curieux", "simples"],
    we_are_not: ["distants", "corporate", "prétentieux"],
    defaults: { tone: "friendly", length: "short", emojis: true, hashtags: false, cta: "" },
    examplePost: [
      "Vendredi, toute l'équipe data a troqué les requêtes SQL contre des feutres.",
      "Au programme : un atelier dataviz, un jeu de données sur les vélos en libre-service et beaucoup de débats sur les couleurs.",
      "Chacun est reparti avec un graphique refait de zéro, et quelques idées pour les projets de la semaine.",
      "C'est aussi comme ça que nous apprenons les uns des autres.",
    ].join("\n\n"),
  },
  {
    id: "direct",
    label: "Direct",
    description: "Phrases courtes, une idée par paragraphe, un avis assumé.",
    voice_adjectives: ["direct", "clair", "assuré"],
    we_are: ["francs", "pragmatiques", "orientés résultats"],
    we_are_not: ["flous", "bavards", "consensuels à tout prix"],
    defaults: { tone: "inspiring", length: "short", emojis: false, hashtags: true, cta: "" },
    examplePost: [
      "Un tableau de bord que personne n'ouvre ne sert à rien.",
      "Avant d'en construire un, nous posons une seule question : quelle décision va-t-il aider à prendre ?",
      "Pas de réponse, pas de tableau de bord.",
      "Cette règle nous a fait supprimer la moitié des indicateurs d'un projet. Les utilisateurs ne les ont jamais réclamés.",
      "#Data",
    ].join("\n\n"),
  },
]

// Matière fixe du post de test, identique à chaque essai. Les clés de `answers` sont les questions
// du gabarit « Arrivée d'un collaborateur » (lib/post-types.ts).
export const TEST_MATERIAL: { type: PostTypeId; summary: string; answers: Record<string, string> } = {
  type: "newcomer",
  summary: "Arrivée de Camille, consultante data",
  answers: {
    who: "Camille, consultante data, arrive lundi dans l'équipe BI",
    background: "6 ans dans la distribution, tableaux de bord pour 40 magasins, passionnée de dataviz",
    mission: "projets de pilotage commercial pour nos clients de la distribution",
    detail: "grimpe tous les week-ends, a animé un meetup dataviz",
  },
}
