import type { GenerateInput } from "@/lib/ai/schema"
import { POST_TYPES, TONE_LABELS, type Length } from "@/lib/post-types"
import type { Tables } from "@/lib/supabase/database.types"

export type EditorialLine = Pick<
  Tables<"editorial_line">,
  "ton" | "valeurs" | "mots_a_eviter" | "exemples"
>

// Le modèle respecte mieux un nombre de paragraphes et de mots qu'un nombre de caractères.
const LENGTH_TARGETS: Record<Length, string> = {
  short: "3 ou 4 paragraphes courts, environ 80 mots",
  medium: "5 ou 6 paragraphes courts, environ 150 mots",
  long: "7 à 9 paragraphes courts, environ 250 mots",
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
    "Règles de rédaction :",
    "- Première ligne : une accroche de moins de 150 caractères, tirée d'un fait ou d'un chiffre des notes.",
    "- Paragraphes d'une ou deux phrases, séparés par une ligne vide.",
    "- Le texte se termine par un appel à l'action, qui s'adresse au lecteur comme le prévoit la ligne éditoriale.",
    "- Texte brut : ni markdown, ni titre, ni gras.",
    "- Les notes sont écrites en vrac : remets-les en forme et corrige les fautes.",
    "- N'ajoute rien qui ne figure pas dans les notes : ni fait, ni chiffre, ni nom, ni anecdote, ni bénéfice supposé. Reprends les chiffres exactement.",
    "- Pas de morale ni de conclusion générale.",
    "- N'emploie aucun des mots à éviter, même dans une négation.",
    "- Français correct, même dans un ton familier : « ce n'est pas », jamais « c'est pas ».",
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
    `- Ton de ce post, dans le cadre de la ligne éditoriale : ${TONE_LABELS[params.tone]}`,
    `- Longueur : ${LENGTH_TARGETS[params.length]}`,
    `- Emojis : ${params.emojis ? "2 ou 3, en début de paragraphe" : "aucun"}`,
    `- Appel à l'action : ${params.cta || "au choix, adapté au type de post"}`,
    `- Hashtags : ${params.hashtags ? "3 à 5 hashtags courants sur LinkedIn, seuls sur la dernière ligne, après une ligne vide" : "aucun"}`,
    "",
    input.currentText
      ? "Rédige une nouvelle variante : garde les faits et les modifications de l'auteur, change l'angle, l'accroche et la structure."
      : "Rédige le post."
  )

  return lines.join("\n")
}
