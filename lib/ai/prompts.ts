import type { GenerateInput } from "@/lib/ai/schema"
import { POST_TYPES, TONE_LABELS, type Length, type PostTypeId } from "@/lib/post-types"
import type { Tables } from "@/lib/supabase/database.types"

export type EditorialLine = Pick<
  Tables<"editorial_line">,
  "ton" | "valeurs" | "mots_a_eviter" | "exemples"
>

// Le modèle respecte mieux un nombre de paragraphes et de mots qu'un nombre de caractères.
const LENGTH_TARGETS: Record<Length, string> = {
  short: "3 ou 4 paragraphes courts, environ 80 mots",
  medium: "5 ou 6 paragraphes courts, environ 150 mots",
  long: "7 à 9 paragraphes courts, jusqu'à 250 mots ; moins si les notes ne suffisent pas",
}

// Appel à l'action proposé quand l'auteur n'en a pas saisi. Formulé au tutoiement
// comme la ligne éditoriale de démo : une consigne à la 3e personne fait vouvoyer le modèle.
const DEFAULT_CTAS: Record<PostTypeId, string> = {
  employer_brand: "une question au lecteur, du type « Et dans ton équipe, ça se passe comment ? »",
  delivered_project: "une invitation du type « Tu as relevé un défi similaire ? Raconte-nous en commentaire. »",
  tech_feedback: "une question du type « Et toi, comment tu gères ce problème ? »",
  event: "une invitation du type « Tu viens ? On t'attend sur place. »",
  new_hire: "une invitation du type « Souhaite-lui la bienvenue en commentaire ! »",
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
    "1. L'accroche : une phrase de moins de 150 caractères, tirée d'un fait ou d'un chiffre des notes.",
    "2. Le corps : des paragraphes d'une ou deux phrases. Un paragraphe tient sur une seule ligne, sans retour à la ligne interne.",
    "3. L'appel à l'action : une phrase, seule dans son paragraphe.",
    "4. Les hashtags, s'ils sont demandés : seuls sur la dernière ligne.",
    "",
    "Règles de contenu :",
    "- Chaque phrase reprend une information des notes. N'ajoute ni fait, ni chiffre, ni nom, ni lieu, ni étape de méthode, ni bénéfice ou ressenti absent des notes (par exemple « moins de stress », « on a gagné en clarté »). Reprends les chiffres exactement.",
    "- Si les notes ne suffisent pas pour la longueur demandée, écris plus court plutôt que d'inventer.",
    "- Pas de morale ni de conclusion générale.",
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
    `- Emojis : ${params.emojis ? "2 ou 3, chacun au début d'un paragraphe différent" : "aucun"}`,
    `- Appel à l'action, en dernier paragraphe (avant les hashtags), jamais en accroche : ${params.cta ? `« ${params.cta} », remis en forme` : DEFAULT_CTAS[input.type]}`,
    `- Hashtags : ${params.hashtags ? "3 à 5 hashtags génériques, courants sur LinkedIn" : "aucun"}`,
    "",
    input.currentText
      ? "Rédige une nouvelle variante : garde les faits et les modifications de l'auteur, change l'angle, l'accroche et la structure."
      : "Rédige le post."
  )

  return lines.join("\n")
}
