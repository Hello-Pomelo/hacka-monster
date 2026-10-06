// Contrat de la piste Création de post : types partagés par les écrans, schémas des entrées,
// textes affichés et règles simples. Utilisable côté serveur et client.

import { z } from "zod"

import { POST_TYPE_IDS } from "@/lib/post-types"
import { postParamsSchema, type Post, type PostParams } from "@/lib/posts"
import {
  SERIES_TOO_LONG_MESSAGE,
  START_DATE_PAST_MESSAGE,
  dayKeySchema,
  seriesScheduleSchema,
  slotTouchedSchema,
} from "@/lib/series"

export { parseAnswers } from "@/lib/series"

export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string; code?: "not_connected" }

export const ACTION_UNREACHABLE_MESSAGE = "Le serveur ne répond pas. Vérifiez votre connexion, puis réessayez."

// Appel d'une Server Action depuis le navigateur : une requête qui n'aboutit pas devient un échec
// affiché en toast, au lieu d'une erreur levée dans la transition.
export async function callAction<T>(action: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await action()
  } catch {
    return { ok: false, error: ACTION_UNREACHABLE_MESSAGE }
  }
}

// Colonnes d'un post lues par l'éditeur (E3) et renvoyées par les Server Actions.
export const EDITOR_POST_COLUMNS =
  "id, type, sujet, content, status, origin, scheduled_at, validated_at, image_path, image_alt, failure_reason, linkedin_url, published_at, series_id, editorial_line_id, answers, params, angle, guardrail_report, updated_at" as const

export type EditorPost = Pick<
  Post,
  | "id"
  | "type"
  | "sujet"
  | "content"
  | "status"
  | "origin"
  | "scheduled_at"
  | "validated_at"
  | "image_path"
  | "image_alt"
  | "failure_reason"
  | "linkedin_url"
  | "published_at"
  | "series_id"
  | "editorial_line_id"
  | "answers"
  | "params"
  | "angle"
  | "guardrail_report"
  | "updated_at"
>

export type LineCode = "marketing" | "rh" | "neutre"

export type LineOption = {
  id: string
  code: LineCode
  name: string
  configured: boolean
  defaults: Partial<PostParams>
}

export type SeriesSummary = {
  id: string
  subject: string
  brief: string
  type: string
  editorialLineId: string | null
}

export type LinkedInConnectionSummary = {
  mode: "linkedin" | "demo"
  targetName: string
  targetLogoUrl: string | null
  expiresAt: string | null
}

export const CONNECTION_SETTINGS_HREF = "/parametrage?onglet=connexion"
export const LINES_SETTINGS_HREF = "/parametrage?onglet=lignes"

// Préremplissage de /posts/new (clés de newPostHref) : une valeur invalide est ignorée.
const firstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value)

export const newPostSearchSchema = z.object({
  date: z.preprocess(firstValue, dayKeySchema).optional().catch(undefined),
  subject: z.preprocess(firstValue, z.string().trim().max(300)).optional().catch(undefined),
  type: z.preprocess(firstValue, z.enum(POST_TYPE_IDS)).optional().catch(undefined),
  lineCode: z.preprocess(firstValue, z.enum(["marketing", "rh"])).optional().catch(undefined),
  ideaId: z.preprocess(firstValue, z.uuid()).optional().catch(undefined),
  suggestionKey: z
    .preprocess(firstValue, z.string().trim().min(1).max(200))
    .optional()
    .catch(undefined),
})
export type NewPostSearch = z.infer<typeof newPostSearchSchema>

const answersSchema = z.record(z.string(), z.string().trim().max(2000))

export const newPostInputSchema = z
  .object({
    mode: z.enum(["ai", "manual"]),
    type: z.enum(POST_TYPE_IDS),
    subject: z.string().trim().max(300),
    brief: z.string().trim().max(2000),
    answers: answersSchema,
    lineId: z.uuid().nullable(),
    date: dayKeySchema.optional(),
    ideaId: z.uuid().optional(),
    suggestionKey: z.string().trim().min(1).max(200).optional(),
  })
  .refine((input) => input.mode === "manual" || input.subject.length > 0, {
    message: "Décrivez le sujet du post.",
    path: ["subject"],
  })
export type NewPostInput = z.infer<typeof newPostInputSchema>

export const seriesFormInputSchema = z.object({
  seriesId: z.uuid(),
  type: z.enum(POST_TYPE_IDS),
  subject: z.string().trim().min(1, "Décrivez le sujet de la série.").max(300),
  brief: z.string().trim().max(2000),
  answers: answersSchema,
  lineId: z.uuid(),
  params: postParamsSchema,
  schedule: seriesScheduleSchema,
  slotTouched: slotTouchedSchema,
})
export type SeriesFormInput = z.infer<typeof seriesFormInputSchema>

export const CREATION_TEXTS = {
  linkedinMissing: "Connectez la page LinkedIn pour pouvoir programmer",
  linkedinMissingLink: "Connecter la page",
  lineNotConfigured: "Ligne éditoriale non configurée. Les posts utiliseront un ton neutre.",
  lineNotConfiguredLink: "Configurer la ligne",
  seriesTooLong: SERIES_TOO_LONG_MESSAGE,
  startDatePast: START_DATE_PAST_MESSAGE,
  notValidated: "Non validé : ouvrez et validez ce post pour le programmer.",
  tokenExpired: "La connexion à LinkedIn expire avant cette date. Reconnectez la page.",
  imageRefused: "LinkedIn a refusé l'image. Remplacez-la puis reprogrammez le post.",
  uncertain: "Nous ne savons pas si ce post a été publié. Vérifiez sur LinkedIn avant de le reprogrammer.",
  noClients: "Aucun client déclaré dans la charte : les noms de clients ne sont pas vérifiés.",
  guardrailAtPublish: "Ce post n'a pas été publié : il cite un client devenu non citable.",
  previewNotice: "Rendu indicatif, l'affichage réel dépend de LinkedIn.",
  writing: "En cours d'écriture",
  emptyList: "Aucun post pour l'instant",
  importedSeries: "Importé de LinkedIn",
  singlePost: "Post seul",
  saved: "Enregistré",
  saving: "Enregistrement…",
  saveFailed: "Échec de l'enregistrement",
} as const

export function clientNotCitableMessage(name: string): string {
  return `Ce texte cite un client non citable : ${name}. Retirez-le pour continuer.`
}

export function scheduledToast(n: number): string {
  return n === 1 ? "1 post programmé" : `${n} posts programmés`
}

export function failedBannerText(n: number): string {
  return n === 1 ? "1 post n'a pas pu être publié" : `${n} posts n'ont pas pu être publiés`
}

export function isLineConfigured(line: LineOption | null | undefined): boolean {
  return Boolean(line && line.code !== "neutre" && line.configured)
}

// Ligne par défaut : celle du préremplissage, sinon celle de l'admin, sinon Neutre.
export function resolveDefaultLine(
  lines: LineOption[],
  opts: { lineCode?: "marketing" | "rh"; profileLineId: string | null }
): LineOption | null {
  return (
    (opts.lineCode && lines.find((line) => line.code === opts.lineCode)) ||
    (opts.profileLineId && lines.find((line) => line.id === opts.profileLineId)) ||
    lines.find((line) => line.code === "neutre") ||
    null
  )
}

// Post écrit à la main (E1 « Écrire moi-même ») : ni série, ni IA.
export function isManualPost(post: Pick<EditorPost, "series_id" | "origin">): boolean {
  return post.origin === "app" && !post.series_id
}

export function canGenerate(post: Pick<EditorPost, "status" | "origin" | "series_id">): boolean {
  return (
    post.origin === "app" &&
    Boolean(post.series_id) &&
    (post.status === "draft" || post.status === "failed")
  )
}

export function seriesLabel(
  post: Pick<EditorPost, "origin" | "series_id">,
  seriesSubject: string | null
): string {
  if (post.origin === "linkedin_import") return CREATION_TEXTS.importedSeries
  if (post.series_id && seriesSubject) return seriesSubject
  return CREATION_TEXTS.singlePost
}

// Message lisible pour une erreur Supabase sur un post, dont les refus du trigger posts_check_update.
export function toPostError(error: { message?: string; code?: string } | null | undefined): string {
  const message = error?.message ?? ""
  if (error?.code === "PGRST116") return "Ce post n'existe pas ou n'est plus modifiable."
  if (message.includes("Texte vide")) {
    return "Le texte du post est vide : rédigez-le avant de le programmer."
  }
  if (message.includes("Date de publication passée")) {
    return "La date de publication est passée : choisissez une date à venir."
  }
  if (message.includes("lecture seule")) return "Ce post est en lecture seule."
  if (message.includes("Transition")) return "Cette action n'est pas possible pour un post à ce statut."
  if (message.includes("jamais publié") || message.includes("déjà publié")) {
    return "Ce post ne peut pas être restauré à ce statut."
  }
  if (error?.code === "23514") return "Le texte dépasse 3 000 caractères."
  return "L'enregistrement a échoué. Réessayez."
}
