// Types de post, questions guidées (F1) et options des paramètres de rédaction.
// Partagé par le formulaire (piste A) et le prompt (piste B).

export const POST_TYPE_IDS = [
  "employer_brand",
  "delivered_project",
  "tech_feedback",
  "event",
  "new_hire",
] as const
export type PostTypeId = (typeof POST_TYPE_IDS)[number]

export type GuidedQuestion = {
  id: string
  label: string
  placeholder: string
}

export type PostTypeConfig = {
  label: string
  description: string
  questions: GuidedQuestion[]
}

export const POST_TYPES: Record<PostTypeId, PostTypeConfig> = {
  employer_brand: {
    label: "Marque employeur",
    description: "Montrer la réalité des métiers et de l'équipe",
    questions: [
      {
        id: "moment",
        label: "Quel moment ou quel aspect de l'équipe veux-tu montrer ?",
        placeholder: "séminaire, rituel du vendredi, journée type d'une data engineer…",
      },
      {
        id: "people",
        label: "Qui est concerné ?",
        placeholder: "l'équipe data, 12 personnes…",
      },
      {
        id: "meaning",
        label: "Qu'est-ce que ça dit de la vie chez nous ?",
        placeholder: "on prend le temps d'apprendre, on rit beaucoup…",
      },
    ],
  },
  delivered_project: {
    label: "Projet livré",
    description: "Valoriser un projet mené à bien",
    questions: [
      {
        id: "project",
        label: "Quel projet, pour quel type de client ?",
        placeholder: "tableau de bord commercial pour un distributeur…",
      },
      {
        id: "problem",
        label: "Quel problème résout-il ?",
        placeholder: "les commerciaux attendaient leurs chiffres 3 jours…",
      },
      {
        id: "result",
        label: "Quel résultat, quel chiffre marquant ?",
        placeholder: "chiffres disponibles chaque matin, 40 utilisateurs…",
      },
      {
        id: "team",
        label: "Qui a participé ?",
        placeholder: "2 data engineers, 1 cheffe de projet…",
      },
    ],
  },
  tech_feedback: {
    label: "Retour d'expérience technique",
    description: "Partager un apprentissage technique",
    questions: [
      {
        id: "topic",
        label: "Quel sujet technique ?",
        placeholder: "migration d'orchestrateur, tests de données…",
      },
      {
        id: "difficulty",
        label: "Quelle difficulté avez-vous rencontrée ?",
        placeholder: "des traitements tombaient la nuit sans alerte…",
      },
      {
        id: "lesson",
        label: "Qu'en retenez-vous ?",
        placeholder: "tester les données comme du code…",
      },
    ],
  },
  event: {
    label: "Événement",
    description: "Annoncer ou raconter un événement",
    questions: [
      {
        id: "event",
        label: "Quel événement, où et quand ?",
        placeholder: "meetup data à Lyon, jeudi 15 octobre…",
      },
      {
        id: "role",
        label: "Quel rôle y jouez-vous ?",
        placeholder: "on organise, on donne un talk, on y va en équipe…",
      },
      {
        id: "takeaway",
        label: "Qu'en retenir, ou pourquoi venir ?",
        placeholder: "retours d'expérience concrets, apéro après…",
      },
    ],
  },
  new_hire: {
    label: "Arrivée d'un collaborateur",
    description: "Souhaiter la bienvenue à une nouvelle recrue",
    questions: [
      {
        id: "who",
        label: "Qui arrive, à quel poste ?",
        placeholder: "Camille, consultante data…",
      },
      {
        id: "background",
        label: "Quel parcours ?",
        placeholder: "6 ans dans la distribution, passionnée de dataviz…",
      },
      {
        id: "mission",
        label: "Sur quoi va-t-elle ou va-t-il travailler ?",
        placeholder: "projets BI pour nos clients…",
      },
    ],
  },
}

export const TONE_IDS = ["professional", "friendly", "inspiring", "casual"] as const
export type Tone = (typeof TONE_IDS)[number]
export const TONE_LABELS: Record<Tone, string> = {
  professional: "Professionnel",
  friendly: "Chaleureux",
  inspiring: "Inspirant",
  casual: "Décontracté",
}

export const LENGTH_IDS = ["short", "medium", "long"] as const
export type Length = (typeof LENGTH_IDS)[number]
export const LENGTH_LABELS: Record<Length, string> = {
  short: "Court",
  medium: "Moyen",
  long: "Long",
}
