// Gabarits des types de post (spec Paramétrage, `post_template`, D21) et options des réglages
// de rédaction. Source unique des types : création de post, calendrier et prompts la lisent.

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

// Réglages de rédaction d'un post (colonne `posts.params`). `cta` vide : l'IA choisit l'appel à l'action.
export type PostParams = {
  tone: Tone
  length: Length
  emojis: boolean
  hashtags: boolean
  cta: string
}

export const POST_TYPE_IDS = [
  "newcomer",
  "project_delivered",
  "tech_feedback",
  "event",
  "employer_brand",
  "hiring",
] as const
export type PostTypeId = (typeof POST_TYPE_IDS)[number]

export type GuidedQuestion = {
  id: string
  label: string
  placeholder: string
}

export type PostTemplate = {
  label: string
  description: string
  objective: string
  audience: string
  questions: GuidedQuestion[]
  // Ordre du corps du post, en une phrase, transmis tel quel au prompt.
  structure: string
  defaults: Partial<PostParams>
  examplePost?: string
  // Gabarit détaillé au hackathon (questions, structure et exemple) ; sinon gabarit générique.
  detailed: boolean
}

export const POST_TYPES: Record<PostTypeId, PostTemplate> = {
  newcomer: {
    label: "Arrivée d'un collaborateur",
    description: "Souhaiter la bienvenue à une nouvelle recrue",
    objective: "Accueillir publiquement la personne et montrer que l'équipe grandit",
    audience: "Réseau de la personne, candidats, clients",
    questions: [
      {
        id: "who",
        label: "Qui arrive, à quel poste ?",
        placeholder: "Camille, consultante data…",
      },
      {
        id: "background",
        label: "Quel est son parcours ?",
        placeholder: "6 ans dans la distribution, passionnée de dataviz…",
      },
      {
        id: "mission",
        label: "Sur quoi va-t-elle ou va-t-il travailler ?",
        placeholder: "projets BI pour nos clients…",
      },
      {
        id: "detail",
        label: "Un détail personnel à partager, avec son accord ?",
        placeholder: "grimpe tous les week-ends, a animé un meetup dataviz…",
      },
    ],
    structure:
      "qui arrive et à quel poste, son parcours, sa mission, puis un détail personnel s'il est donné",
    defaults: { tone: "friendly", length: "short" },
    examplePost: [
      "Camille rejoint l'équipe data comme consultante BI.",
      "Elle a passé 6 ans dans la distribution, où elle a construit les tableaux de bord de 40 magasins.",
      "Chez nous, elle accompagnera nos clients sur leurs projets de pilotage commercial.",
      "Le week-end, Camille grimpe : l'équipe a déjà repéré la salle d'escalade la plus proche.",
      "Bienvenue Camille !",
    ].join("\n\n"),
    detailed: true,
  },
  project_delivered: {
    label: "Projet livré",
    description: "Valoriser un projet mené à bien",
    objective: "Prouver l'expertise de l'équipe par un résultat client",
    audience: "Clients et prospects",
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
        id: "choice",
        label: "Quel choix a fait la différence ?",
        placeholder: "calculer les indicateurs une seule fois dans l'entrepôt, livrer en 3 lots…",
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
    structure:
      "le problème du client, ce que l'équipe a livré et le choix qui a fait la différence, puis le résultat chiffré",
    defaults: { tone: "professional", length: "medium", hashtags: true },
    examplePost: [
      "Les commerciaux d'un distributeur de 300 personnes attendaient leurs chiffres 3 jours.",
      "Ils les reçoivent maintenant chaque matin à 8 h.",
      "Notre équipe a livré un tableau de bord commercial branché sur leur ERP, en 3 lots de deux semaines.",
      "Le choix décisif : calculer chaque indicateur une seule fois, dans l'entrepôt de données, plutôt que dans chaque rapport.",
      "40 commerciaux l'utilisent chaque jour depuis le premier mois.",
      "Merci à Inès, Hugo et Léa pour ce projet.",
      "#BusinessIntelligence #Data",
    ].join("\n\n"),
    detailed: true,
  },
  tech_feedback: {
    label: "Retour d'expérience technique",
    description: "Partager un apprentissage technique",
    objective: "Montrer l'expertise de l'équipe par ce qu'elle a appris",
    audience: "Pairs du métier, candidats techniques",
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
    structure:
      "la difficulté rencontrée, ce que l'équipe a essayé ou corrigé, puis ce qu'elle en retient",
    defaults: { tone: "professional" },
    detailed: false,
  },
  event: {
    label: "Événement",
    description: "Annoncer ou raconter un événement",
    objective: "Faire venir à un événement ou en partager les enseignements",
    audience: "Communauté du métier, clients, candidats",
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
    structure:
      "l'événement (quoi, où, quand), le rôle de l'équipe, puis pourquoi venir ou ce qu'il faut en retenir",
    defaults: { length: "short" },
    detailed: false,
  },
  employer_brand: {
    label: "Marque employeur (coulisses et équipe)",
    description: "Montrer la réalité des métiers et de l'équipe",
    objective: "Donner envie de rejoindre l'entreprise en montrant son quotidien",
    audience: "Candidats, collaborateurs",
    questions: [
      {
        id: "moment",
        label: "Quel moment ou quel aspect de l'équipe voulez-vous montrer ?",
        placeholder: "séminaire, rituel du vendredi, journée type d'une data engineer…",
      },
      {
        id: "people",
        label: "Qui est concerné ?",
        placeholder: "l'équipe data, 12 personnes…",
      },
      {
        id: "meaning",
        label: "Que dit ce moment de la vie dans l'entreprise ?",
        placeholder: "on prend le temps d'apprendre, on rit beaucoup…",
      },
    ],
    structure:
      "une scène concrète (un moment, des personnes), puis ce qu'elle montre de la façon de travailler ensemble",
    defaults: { tone: "friendly" },
    detailed: false,
  },
  hiring: {
    label: "Recrutement",
    description: "Faire connaître un poste ouvert",
    objective: "Susciter des candidatures pour un poste ouvert",
    audience: "Candidats et leur réseau",
    questions: [
      {
        id: "role",
        label: "Quel poste recrutez-vous ?",
        placeholder: "data engineer confirmé ou confirmée, CDI à Lyon…",
      },
      {
        id: "team",
        label: "Dans quelle équipe, sur quels projets ?",
        placeholder: "équipe data de 8 personnes, migrations vers le cloud…",
      },
      {
        id: "profile",
        label: "Quel profil cherchez-vous ?",
        placeholder: "3 ans d'expérience, à l'aise avec SQL et Python…",
      },
      {
        id: "apply",
        label: "Comment postuler ?",
        placeholder: "lien vers l'offre, contact de la recruteuse…",
      },
    ],
    structure: "le poste et l'équipe, les projets, le profil recherché, puis comment postuler",
    defaults: { tone: "friendly", hashtags: true },
    detailed: false,
  },
}

// `posts.type` et `series.type` sont du texte en base : à vérifier avant d'indexer POST_TYPES.
export function isPostTypeId(value: string): value is PostTypeId {
  return (POST_TYPE_IDS as readonly string[]).includes(value)
}
