import type { GenerateInput } from "@/lib/ai/schema"
import { POST_TYPES, TONE_LABELS, type Length, type PostTypeId } from "@/lib/post-types"
import type { Enums, Tables } from "@/lib/supabase/database.types"

export type EditorialLine = Pick<
  Tables<"editorial_line">,
  "ton" | "valeurs" | "mots_a_eviter" | "exemples"
>

// Le modèle respecte mieux un nombre de paragraphes et de mots qu'un nombre de caractères.
// LinkedIn favorise les posts de plus de 1 000 caractères (environ 170 mots), mais une longueur
// minimale pousse le modèle à inventer quand les notes sont courtes : ce sont des plafonds.
const LENGTH_TARGETS: Record<Length, string> = {
  short: "3 ou 4 paragraphes courts, jusqu'à 100 mots",
  medium: "5 à 7 paragraphes courts, jusqu'à 200 mots, sans dépasser ce que les notes contiennent",
  long: "7 à 10 paragraphes courts, jusqu'à 300 mots, sans dépasser ce que les notes contiennent",
}

// Ordre du corps par type de post, calqué sur les piliers éditoriaux (prouver, expertiser, incarner).
const STRUCTURES: Record<PostTypeId, string> = {
  employer_brand: "une scène concrète (un moment, des personnes), puis ce qu'elle montre de la façon de travailler ensemble",
  project_delivered: "le problème du client, ce que l'équipe a livré, puis le résultat chiffré",
  tech_feedback: "la difficulté rencontrée, ce que l'équipe a essayé ou corrigé, puis ce qu'elle en retient",
  event: "l'événement (quoi, où, quand), le rôle de l'équipe, puis pourquoi venir ou ce qu'il faut en retenir",
  newcomer: "qui arrive et à quel poste, son parcours, puis sa mission",
  hiring: "le poste et l'équipe, la mission, le profil recherché, puis comment postuler",
}

// Appel à l'action proposé quand l'auteur n'en a pas saisi. Formulé au tutoiement
// comme la ligne éditoriale de démo : une consigne à la 3e personne fait vouvoyer le modèle.
// Pas de « Et vous ? » : LinkedIn rétrograde l'engagement forcé.
const DEFAULT_CTAS: Record<PostTypeId, string> = {
  employer_brand: "une phrase de clôture sans question, ou une question sur la pratique précise décrite dans les notes",
  project_delivered: "une phrase de clôture sans question, ou une question d'expert sur un choix cité dans les notes",
  tech_feedback: "une question technique précise sur la difficulté décrite dans les notes, à laquelle un pair du métier peut répondre",
  event: "l'information pratique pour venir (date, lieu, inscription) si les notes la donnent, sinon une phrase de clôture sans question",
  newcomer: "une phrase de bienvenue adressée à la personne, sans question",
  hiring: "l'invitation à postuler ou à partager l'offre, sans question",
}

const VOICES: Record<Enums<"post_target">, string> = {
  perso:
    "Post publié depuis le profil personnel de l'auteur : écris à la première personne (« je »), « nous » pour l'équipe, même si la ligne éditoriale parle au « nous ». Aucun lien dans le texte.",
  entreprise: "Post publié sur la page de l'entreprise : écris au « nous ».",
}

export function buildSystemPrompt(line: EditorialLine): string {
  return [
    "Tu es le community manager de l'entreprise. Tu rédiges en français des posts LinkedIn prêts à publier, à partir des notes d'un collaborateur.",
    "",
    "Ligne éditoriale de l'entreprise :",
    `- Ton : ${line.ton}`,
    `- Valeurs : ${line.valeurs}`,
    `- Mots et formulations à éviter : ${line.mots_a_eviter}`,
    "",
    "Exemples de posts dans le ton attendu (pour le style, pas pour le contenu) :",
    '"""',
    line.exemples,
    '"""',
    "",
    "Structure du post, chaque bloc séparé du suivant par une ligne vide :",
    "1. L'accroche : une phrase de moins de 150 caractères, tirée du fait le plus concret des notes : un chiffre, un résultat, une erreur. Jamais une présentation de l'auteur ni une question rhétorique.",
    "2. Le corps : des paragraphes d'une ou deux phrases, dans l'ordre de la trame indiquée. Saute une étape de la trame si les notes ne la renseignent pas. Un paragraphe tient sur une seule ligne, sans retour à la ligne interne.",
    "3. L'appel à l'action : une phrase, seule dans son paragraphe. Si c'est une question, elle est précise et un pair du métier peut y répondre : jamais « Et vous ? » ni « Qu'en pensez-vous ? ».",
    "4. Les hashtags, s'ils sont demandés : seuls sur la dernière ligne.",
    "",
    "Règles de contenu :",
    "- Chaque phrase reprend une information des notes. N'ajoute ni fait, ni chiffre, ni nom, ni lieu, ni étape de méthode, ni qualificatif, ni bénéfice absent des notes (par exemple « simple et sécurisé », « moins d'erreurs », « on a gagné en clarté »). Reprends les chiffres exactement.",
    "- Si les notes ne suffisent pas pour la longueur demandée, écris plus court plutôt que d'inventer.",
    "- Désigne un client par son secteur et sa taille (« un distributeur de 300 personnes »), sauf si les notes le nomment.",
    "- Un chiffre qui ne vient pas d'un projet ou de l'équipe garde la source donnée dans les notes. Sans source, retire-le.",
    "- Pas de morale ni de conclusion générale.",
    "- Pas de tournures de texte généré : « Dans un monde où », « Voici pourquoi », « Nous sommes ravis », « drastiquement », listes à ✅, tiret cadratin.",
    "- Adresse-toi au lecteur comme le prévoit la ligne éditoriale, quel que soit le ton du post. Si elle tutoie, tutoie partout, appel à l'action compris : « partage », « dis-nous », jamais « partagez ».",
    "- N'emploie aucun des mots à éviter, ni un mot de la même famille, même dans une négation.",
    "- Les notes sont écrites en vrac : remets-les en forme et corrige les fautes.",
    "- Français correct, même dans un ton familier : « ce n'est pas », jamais « c'est pas ».",
    "- Texte brut : ni markdown, ni titre, ni gras.",
    "- Réponds uniquement par le texte du post, sans introduction ni commentaire.",
  ].join("\n")
}

export function buildUserPrompt(input: GenerateInput): string {
  const postType = POST_TYPES[input.type]
  const notes = postType.questions.flatMap((question) => {
    const answer = input.answers[question.id]?.trim()
    return answer ? [`- ${question.label}\n  ${answer}`] : []
  })
  const { params } = input

  const lines = [
    `Type de post : ${postType.label}`,
    `Trame du corps : ${STRUCTURES[input.type]}`,
    "",
    "Notes de l'auteur :",
    ...(notes.length > 0 ? notes : ["(aucune note)"]),
    "",
  ]

  if (input.currentText) {
    lines.push(
      "Version actuelle du post, éventuellement modifiée par l'auteur :",
      '"""',
      input.currentText,
      '"""',
      ""
    )
  }

  lines.push(
    "Contraintes :",
    ...(input.cible ? [`- ${VOICES[input.cible]}`] : []),
    `- Ton de ce post, dans le cadre de la ligne éditoriale : ${TONE_LABELS[params.tone]}`,
    `- Longueur : ${LENGTH_TARGETS[params.length]}`,
    `- Emojis : ${params.emojis ? "un seul, au début d'un paragraphe, jamais en puce" : "aucun"}`,
    `- Appel à l'action, en dernier paragraphe (avant les hashtags), jamais en accroche : ${params.cta ? `« ${params.cta} », remis en forme` : DEFAULT_CTAS[input.type]}`,
    `- Hashtags : ${params.hashtags ? "1 ou 2 hashtags précis sur le sujet du post" : "aucun"}`,
    "",
    input.currentText
      ? "Rédige une nouvelle variante : garde les faits et les modifications de l'auteur, change l'accroche et l'angle (par exemple partir du résultat plutôt que du problème)."
      : "Rédige le post."
  )

  return lines.join("\n")
}
