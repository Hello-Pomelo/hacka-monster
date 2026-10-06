"use server"

// Server Actions des posts (spec Création de post, E1 manuel, E3, E5). Le trigger posts_check_update
// reste la seule garde des transitions et de la lecture seule : ses refus sont traduits par toPostError.

import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  CREATION_TEXTS,
  EDITOR_POST_COLUMNS,
  newPostInputSchema,
  toPostError,
  type ActionResult,
  type EditorPost,
  type LineOption,
  type LinkedInConnectionSummary,
  type NewPostInput,
} from "@/lib/creation"
import {
  SIGNED_OUT_MESSAGE,
  consumePrefillSource,
  failure,
  getActionSession,
  getCharterRules,
  getLines,
  getLinkedInConnection,
  zodFailure,
  type ActionFailure,
} from "@/lib/creation-data"
import { checkGuardrails, type CharterRules, type GuardrailReport } from "@/lib/guardrails"
import { publishDuePosts } from "@/lib/linkedin/publish-due"
import {
  MAX_POST_LENGTH,
  POST_IMAGES_BUCKET,
  parsePostParams,
  restoreStatus,
  type PostStatus,
} from "@/lib/posts"
import { RECOMMENDED_SLOTS } from "@/lib/recommended-slots"
import { defaultParamsFor, parisDateTimeToIso } from "@/lib/series"
import { scheduleBlockers } from "@/lib/scheduling"
import type { TablesUpdate } from "@/lib/supabase/database.types"

const postIdSchema = z.uuid()
const EDITABLE_STATUSES: PostStatus[] = ["draft", "failed"]
const NOT_FOUND_MESSAGE = "Ce post n'existe pas ou n'est plus modifiable."
const CHARTER_ERROR = "La charte n'a pas pu être lue. Réessayez."

function revalidatePost(postId: string) {
  revalidatePath("/posts")
  revalidatePath(`/posts/${postId}`)
  revalidatePath("/")
}

// Rapport des garde-fous enregistré avec le texte (spec Paramétrage, section 5) ; null si la
// charte n'a pas pu être lue.
async function guardrailReportFor(content: string, params: unknown): Promise<GuardrailReport | null> {
  try {
    const charter = await getCharterRules()
    return checkGuardrails(content, charter, { hashtagsWanted: parsePostParams(params).hashtags })
  } catch {
    return null
  }
}

// Charte et connexion LinkedIn, relues à chaque programmation.
async function readSchedulingContext(): Promise<
  { ok: true; charter: CharterRules; connection: LinkedInConnectionSummary | null } | ActionFailure
> {
  try {
    const [charter, connection] = await Promise.all([getCharterRules(), getLinkedInConnection()])
    return { ok: true, charter, connection }
  } catch {
    return failure("La charte ou la connexion LinkedIn n'a pas pu être lue. Réessayez.")
  }
}

// E1 « Écrire moi-même » : un Brouillon vide, sans série ni IA. La date du calendrier est
// gardée avec l'heure conseillée pour le type, si elle est à venir.
export async function createManualPost(input: NewPostInput): Promise<ActionResult<{ postId: string }>> {
  const parsed = newPostInputSchema.safeParse(input)
  if (!parsed.success) return zodFailure(parsed.error)
  const { type, subject, answers, lineId, date, ideaId, suggestionKey } = parsed.data
  if (parsed.data.mode !== "manual") return failure("Mode de création invalide.")

  const session = await getActionSession()
  if (!session) return failure(SIGNED_OUT_MESSAGE)

  let lines: LineOption[]
  try {
    lines = await getLines()
  } catch {
    return failure("Les lignes éditoriales n'ont pas pu être lues. Réessayez.")
  }
  const line = lines.find((option) => option.id === lineId) ?? lines.find((option) => option.code === "neutre")

  const iso = date ? parisDateTimeToIso(date, RECOMMENDED_SLOTS[type].time) : null
  const { data, error } = await session.supabase
    .from("posts")
    .insert({
      author_id: session.userId,
      type,
      sujet: subject,
      answers,
      params: defaultParamsFor(type, line?.defaults ?? null),
      editorial_line_id: line?.id ?? null,
      cible: "entreprise",
      scheduled_at: iso && Date.parse(iso) > Date.now() ? iso : null,
    })
    .select("id")
    .single()
  if (error) return failure("Le post n'a pas pu être créé. Réessayez.")

  await consumePrefillSource(session.supabase, { ideaId, suggestionKey })
  revalidatePost(data.id)
  return { ok: true, data: { postId: data.id } }
}

const savePostDraftSchema = z.object({
  postId: z.uuid(),
  content: z.string().max(MAX_POST_LENGTH, "Le texte dépasse 3 000 caractères.").optional(),
  scheduledAt: z.iso.datetime({ offset: true }).nullable().optional(),
  imageAlt: z.string().trim().max(300, "Texte alternatif : 300 caractères au plus.").optional(),
})

// Sauvegarde automatique de E3. Un post Programmé reste Programmé à sa nouvelle date.
export async function savePostDraft(input: {
  postId: string
  content?: string
  scheduledAt?: string | null
  imageAlt?: string
}): Promise<ActionResult<EditorPost>> {
  const parsed = savePostDraftSchema.safeParse(input)
  if (!parsed.success) return zodFailure(parsed.error)
  const { postId, content, scheduledAt, imageAlt } = parsed.data
  if (scheduledAt && Date.parse(scheduledAt) <= Date.now()) {
    return failure("Choisissez une date de publication à venir.", { field: "scheduledAt" })
  }

  const session = await getActionSession()
  if (!session) return failure(SIGNED_OUT_MESSAGE)
  const { supabase } = session

  const { data: current, error: readError } = await supabase
    .from("posts")
    .select(EDITOR_POST_COLUMNS)
    .eq("id", postId)
    .maybeSingle()
  if (readError) return failure(toPostError(readError))
  if (!current) return failure(NOT_FOUND_MESSAGE)
  // Le trigger ne contrôle le texte et la date qu'au passage en Programmé : un post déjà
  // Programmé garde une date et un texte.
  if (current.status === "scheduled" && scheduledAt === null) {
    return failure("Un post programmé garde une date de publication : déprogrammez-le d'abord.", {
      field: "scheduledAt",
    })
  }
  if (current.status === "scheduled" && content !== undefined && !content.trim()) {
    return failure("Un post programmé ne peut pas avoir un texte vide : déprogrammez-le d'abord.", {
      field: "content",
    })
  }

  const changes: TablesUpdate<"posts"> = {}
  if (content !== undefined && content !== current.content) {
    const report = await guardrailReportFor(content, current.params)
    if (!report) return failure(CHARTER_ERROR)
    changes.content = content
    changes.guardrail_report = report
  }
  if (scheduledAt !== undefined) changes.scheduled_at = scheduledAt
  if (imageAlt !== undefined) changes.image_alt = imageAlt || null
  if (Object.keys(changes).length === 0) return { ok: true, data: current }

  const { data, error } = await supabase
    .from("posts")
    .update(changes)
    .eq("id", postId)
    .select(EDITOR_POST_COLUMNS)
    .maybeSingle()
  if (error) return failure(toPostError(error))
  if (!data) return failure(NOT_FOUND_MESSAGE)

  revalidatePost(postId)
  return { ok: true, data }
}

const generatedContentSchema = z.object({
  postId: z.uuid(NOT_FOUND_MESSAGE),
  content: z
    .string()
    .trim()
    .min(1, "Le modèle n'a renvoyé aucun texte. Réessayez.")
    .max(MAX_POST_LENGTH, "Le texte généré dépasse 3 000 caractères : demandez une nouvelle variante."),
})

// Texte rendu par la génération : il remplace le texte et retire la validation (E3).
export async function saveGeneratedContent(postId: string, content: string): Promise<ActionResult<EditorPost>> {
  const parsed = generatedContentSchema.safeParse({ postId, content })
  if (!parsed.success) return zodFailure(parsed.error)
  const text = parsed.data.content

  const session = await getActionSession()
  if (!session) return failure(SIGNED_OUT_MESSAGE)
  const { supabase } = session

  const { data: current, error: readError } = await supabase
    .from("posts")
    .select("params")
    .eq("id", postId)
    .maybeSingle()
  if (readError) return failure(toPostError(readError))
  if (!current) return failure(NOT_FOUND_MESSAGE)

  const report = await guardrailReportFor(text, current.params)
  if (!report) return failure(CHARTER_ERROR)

  const { data, error } = await supabase
    .from("posts")
    .update({ content: text, guardrail_report: report, validated_at: null, validated_by: null })
    .eq("id", postId)
    .in("status", EDITABLE_STATUSES)
    .select(EDITOR_POST_COLUMNS)
    .maybeSingle()
  if (error) return failure(toPostError(error))
  if (!data) return failure("Ce post ne peut plus être régénéré : il n'est plus en Brouillon ni en Échec.")

  revalidatePost(postId)
  return { ok: true, data }
}

// « Valider » : le post est marqué relu par l'auteur, sans changer de statut.
export async function validatePost(postId: string): Promise<ActionResult<EditorPost>> {
  if (!postIdSchema.safeParse(postId).success) return failure(NOT_FOUND_MESSAGE)
  const session = await getActionSession()
  if (!session) return failure(SIGNED_OUT_MESSAGE)
  const { supabase, userId } = session

  const { data: current, error: readError } = await supabase
    .from("posts")
    .select("status, content")
    .eq("id", postId)
    .maybeSingle()
  if (readError) return failure(toPostError(readError))
  if (!current) return failure(NOT_FOUND_MESSAGE)
  if (!EDITABLE_STATUSES.includes(current.status)) {
    return failure("Seul un brouillon ou un post en échec peut être validé.")
  }
  if (!current.content.trim()) return failure("Texte vide : rédigez le post avant de le valider.")

  const { data, error } = await supabase
    .from("posts")
    .update({ validated_at: new Date().toISOString(), validated_by: userId })
    .eq("id", postId)
    .in("status", EDITABLE_STATUSES)
    .select(EDITOR_POST_COLUMNS)
    .maybeSingle()
  if (error) return failure(toPostError(error))
  if (!data) return failure(NOT_FOUND_MESSAGE)

  revalidatePost(postId)
  return { ok: true, data }
}

// Image déjà envoyée dans le bucket par le navigateur, sous « <postId>/<nom>.<jpg|jpeg|png|gif> ».
const setPostImageSchema = z
  .object({
    postId: z.uuid(),
    path: z.string().max(300),
    alt: z.string().trim().max(300, "Texte alternatif : 300 caractères au plus."),
  })
  .refine(
    ({ postId, path }) =>
      path.startsWith(`${postId}/`) && /^[A-Za-z0-9_-]+\.(jpe?g|png|gif)$/i.test(path.slice(postId.length + 1)),
    { message: "Image invalide : JPG, PNG ou GIF.", path: ["path"] }
  )

export async function setPostImage(input: {
  postId: string
  path: string
  alt: string
}): Promise<ActionResult<EditorPost>> {
  const parsed = setPostImageSchema.safeParse(input)
  if (!parsed.success) return zodFailure(parsed.error)
  const { postId, path, alt } = parsed.data

  const session = await getActionSession()
  if (!session) return failure(SIGNED_OUT_MESSAGE)
  const { supabase } = session

  const { data: current, error: readError } = await supabase
    .from("posts")
    .select("image_path")
    .eq("id", postId)
    .maybeSingle()
  if (readError) return failure(toPostError(readError))
  if (!current) return failure(NOT_FOUND_MESSAGE)

  const { data, error } = await supabase
    .from("posts")
    .update({ image_path: path, image_alt: alt || null })
    .eq("id", postId)
    .select(EDITOR_POST_COLUMNS)
    .maybeSingle()
  if (error) return failure(toPostError(error))
  if (!data) return failure(NOT_FOUND_MESSAGE)

  // Image remplacée : supprimée du bucket. Échec sans conséquence, le post ne la référence plus.
  if (current.image_path && current.image_path !== path) {
    await supabase.storage.from(POST_IMAGES_BUCKET).remove([current.image_path])
  }
  revalidatePost(postId)
  return { ok: true, data }
}

export async function removePostImage(postId: string): Promise<ActionResult<EditorPost>> {
  if (!postIdSchema.safeParse(postId).success) return failure(NOT_FOUND_MESSAGE)
  const session = await getActionSession()
  if (!session) return failure(SIGNED_OUT_MESSAGE)
  const { supabase } = session

  const { data: current, error: readError } = await supabase
    .from("posts")
    .select("image_path")
    .eq("id", postId)
    .maybeSingle()
  if (readError) return failure(toPostError(readError))
  if (!current) return failure(NOT_FOUND_MESSAGE)

  const { data, error } = await supabase
    .from("posts")
    .update({ image_path: null, image_alt: null })
    .eq("id", postId)
    .select(EDITOR_POST_COLUMNS)
    .maybeSingle()
  if (error) return failure(toPostError(error))
  if (!data) return failure(NOT_FOUND_MESSAGE)

  if (current.image_path) await supabase.storage.from(POST_IMAGES_BUCKET).remove([current.image_path])
  revalidatePost(postId)
  return { ok: true, data }
}

// « Programmer ce post » : valide et programme en une action (E3).
export async function schedulePost(postId: string): Promise<ActionResult<EditorPost>> {
  if (!postIdSchema.safeParse(postId).success) return failure(NOT_FOUND_MESSAGE)
  const session = await getActionSession()
  if (!session) return failure(SIGNED_OUT_MESSAGE)
  const { supabase, userId } = session

  const { data: post, error: readError } = await supabase
    .from("posts")
    .select(EDITOR_POST_COLUMNS)
    .eq("id", postId)
    .maybeSingle()
  if (readError) return failure(toPostError(readError))
  if (!post) return failure(NOT_FOUND_MESSAGE)
  if (post.origin !== "app" || !EDITABLE_STATUSES.includes(post.status)) {
    return failure("Cette action n'est pas possible pour un post à ce statut.")
  }

  const context = await readSchedulingContext()
  if (!context.ok) return context
  const { charter, connection } = context

  const [blocker] = scheduleBlockers(post, { charter, connection, now: new Date(), requireValidated: false })
  if (blocker) {
    return failure(blocker.message, blocker.reason === "not_connected" ? { code: "not_connected" } : {})
  }

  const report = checkGuardrails(post.content, charter, { hashtagsWanted: parsePostParams(post.params).hashtags })
  const { data, error } = await supabase
    .from("posts")
    .update({
      status: "scheduled",
      guardrail_report: report,
      ...(post.validated_at ? {} : { validated_at: new Date().toISOString(), validated_by: userId }),
    })
    .eq("id", postId)
    .in("status", EDITABLE_STATUSES)
    .select(EDITOR_POST_COLUMNS)
    .maybeSingle()
  if (error) return failure(toPostError(error))
  if (!data) return failure(NOT_FOUND_MESSAGE)

  revalidatePost(postId)
  return { ok: true, data }
}

// E5 : programme les posts validés de la série. Un post non validé n'est jamais programmé ;
// un post qui ne remplit pas une condition reste en Brouillon, avec son motif.
export async function scheduleValidatedPosts(seriesId: string): Promise<
  ActionResult<{ scheduled: EditorPost[]; skipped: { postId: string; message: string }[] }>
> {
  if (!z.uuid().safeParse(seriesId).success) return failure("Série introuvable.")
  const session = await getActionSession()
  if (!session) return failure(SIGNED_OUT_MESSAGE)
  const { supabase } = session

  const context = await readSchedulingContext()
  if (!context.ok) return context
  const { charter, connection } = context
  if (!connection) return failure(CREATION_TEXTS.linkedinMissing, { code: "not_connected" })

  const { data: posts, error: readError } = await supabase
    .from("posts")
    .select(EDITOR_POST_COLUMNS)
    .eq("series_id", seriesId)
    .eq("origin", "app")
    .in("status", EDITABLE_STATUSES)
    .order("scheduled_at", { ascending: true, nullsFirst: false })
  if (readError) return failure(toPostError(readError))

  const scheduled: EditorPost[] = []
  const skipped: { postId: string; message: string }[] = []
  for (const post of posts) {
    const [blocker] = scheduleBlockers(post, { charter, connection, now: new Date(), requireValidated: true })
    if (blocker) {
      skipped.push({ postId: post.id, message: blocker.message })
      continue
    }

    const report = checkGuardrails(post.content, charter, { hashtagsWanted: parsePostParams(post.params).hashtags })
    const { data, error } = await supabase
      .from("posts")
      .update({ status: "scheduled", guardrail_report: report })
      .eq("id", post.id)
      .in("status", EDITABLE_STATUSES)
      .select(EDITOR_POST_COLUMNS)
      .maybeSingle()
    if (error || !data) skipped.push({ postId: post.id, message: error ? toPostError(error) : NOT_FOUND_MESSAGE })
    else scheduled.push(data)
  }

  revalidatePath("/posts")
  revalidatePath("/")
  for (const post of scheduled) revalidatePath(`/posts/${post.id}`)
  return { ok: true, data: { scheduled, skipped } }
}

// « Déprogrammer » : Programmé vers Brouillon, tant que la publication n'a pas commencé.
export async function unschedulePost(postId: string): Promise<ActionResult<EditorPost>> {
  if (!postIdSchema.safeParse(postId).success) return failure(NOT_FOUND_MESSAGE)
  const session = await getActionSession()
  if (!session) return failure(SIGNED_OUT_MESSAGE)

  const { data, error } = await session.supabase
    .from("posts")
    .update({ status: "draft" })
    .eq("id", postId)
    .eq("status", "scheduled")
    .select(EDITOR_POST_COLUMNS)
    .maybeSingle()
  if (error) return failure(toPostError(error))
  if (!data) return failure("Ce post n'est plus programmé : rechargez la page.")

  revalidatePost(postId)
  return { ok: true, data }
}

const PUBLISH_NOW_DELAY_MS = 2_000
const PUBLISH_NOW_ATTEMPTS = 3
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// « Publier maintenant » : programme le post dans 2 secondes puis lance la publication à date,
// sans attendre le cron. Le post suit les transitions habituelles (Programmé, En cours, Publié ou
// Échec). Le post renvoyé porte le résultat : statut Publié, ou Échec avec son motif.
export async function publishPostNow(postId: string): Promise<ActionResult<EditorPost>> {
  if (!postIdSchema.safeParse(postId).success) return failure(NOT_FOUND_MESSAGE)
  const session = await getActionSession()
  if (!session) return failure(SIGNED_OUT_MESSAGE)
  const { supabase, userId } = session

  const secret = process.env.CRON_SECRET
  if (!secret) return failure("Publication immédiate indisponible : CRON_SECRET n'est pas configuré.")

  const publishable: PostStatus[] = [...EDITABLE_STATUSES, "scheduled"]
  const { data: post, error: readError } = await supabase
    .from("posts")
    .select(EDITOR_POST_COLUMNS)
    .eq("id", postId)
    .maybeSingle()
  if (readError) return failure(toPostError(readError))
  if (!post) return failure(NOT_FOUND_MESSAGE)
  if (post.origin !== "app" || !publishable.includes(post.status)) {
    return failure("Cette action n'est pas possible pour un post à ce statut.")
  }

  const context = await readSchedulingContext()
  if (!context.ok) return context
  const { charter, connection } = context

  const scheduledAt = new Date(Date.now() + PUBLISH_NOW_DELAY_MS).toISOString()
  const [blocker] = scheduleBlockers(
    { ...post, scheduled_at: scheduledAt },
    { charter, connection, now: new Date(), requireValidated: false }
  )
  if (blocker) {
    return failure(blocker.message, blocker.reason === "not_connected" ? { code: "not_connected" } : {})
  }

  const report = checkGuardrails(post.content, charter, { hashtagsWanted: parsePostParams(post.params).hashtags })
  const { error: scheduleError } = await supabase
    .from("posts")
    .update({
      status: "scheduled",
      scheduled_at: scheduledAt,
      guardrail_report: report,
      ...(post.validated_at ? {} : { validated_at: new Date().toISOString(), validated_by: userId }),
    })
    .eq("id", postId)
    .in("status", publishable)
  if (scheduleError) return failure(toPostError(scheduleError))

  await sleep(PUBLISH_NOW_DELAY_MS + 500)

  // L'horloge de la base peut différer de quelques centaines de millisecondes : nouvel essai
  // tant que le post n'a pas été pris.
  let current: EditorPost | null = null
  for (let attempt = 0; attempt < PUBLISH_NOW_ATTEMPTS; attempt++) {
    const result = await publishDuePosts(secret)
    if (!result.ok) return failure(result.error)
    if (result.skipped) return failure(CREATION_TEXTS.linkedinMissing, { code: "not_connected" })

    const { data, error } = await supabase.from("posts").select(EDITOR_POST_COLUMNS).eq("id", postId).maybeSingle()
    if (error) return failure(toPostError(error))
    if (!data) return failure(NOT_FOUND_MESSAGE)
    current = data
    if (data.status !== "scheduled") break
    await sleep(1_000)
  }

  revalidatePost(postId)
  if (!current) return failure(NOT_FOUND_MESSAGE)
  return { ok: true, data: current }
}

// « Archiver » : possible depuis tous les statuts sauf En cours. Rien n'est supprimé sur LinkedIn.
export async function archivePost(postId: string): Promise<ActionResult<EditorPost>> {
  if (!postIdSchema.safeParse(postId).success) return failure(NOT_FOUND_MESSAGE)
  const session = await getActionSession()
  if (!session) return failure(SIGNED_OUT_MESSAGE)
  const { supabase } = session

  const { data: current, error: readError } = await supabase
    .from("posts")
    .select("status, origin")
    .eq("id", postId)
    .maybeSingle()
  if (readError) return failure(toPostError(readError))
  if (!current) return failure(NOT_FOUND_MESSAGE)
  if (current.origin === "linkedin_import") return failure("Un post importé de LinkedIn est en lecture seule.")
  if (current.status === "publishing") return failure("Ce post est en cours de publication : il ne peut pas être archivé.")
  if (current.status === "archived") return failure("Ce post est déjà archivé.")

  const { data, error } = await supabase
    .from("posts")
    .update({ status: "archived" })
    .eq("id", postId)
    .eq("status", current.status)
    .select(EDITOR_POST_COLUMNS)
    .maybeSingle()
  if (error) return failure(toPostError(error))
  if (!data) return failure("Le statut de ce post a changé : rechargez la page.")

  revalidatePost(postId)
  return { ok: true, data }
}

// « Restaurer » : Publié si le post a déjà été publié, sinon Brouillon.
export async function restorePost(postId: string): Promise<ActionResult<EditorPost>> {
  if (!postIdSchema.safeParse(postId).success) return failure(NOT_FOUND_MESSAGE)
  const session = await getActionSession()
  if (!session) return failure(SIGNED_OUT_MESSAGE)
  const { supabase } = session

  const { data: current, error: readError } = await supabase
    .from("posts")
    .select("status, published_at")
    .eq("id", postId)
    .maybeSingle()
  if (readError) return failure(toPostError(readError))
  if (!current) return failure(NOT_FOUND_MESSAGE)
  if (current.status !== "archived") return failure("Seul un post archivé peut être restauré.")

  const { data, error } = await supabase
    .from("posts")
    .update({ status: restoreStatus(current) })
    .eq("id", postId)
    .eq("status", "archived")
    .select(EDITOR_POST_COLUMNS)
    .maybeSingle()
  if (error) return failure(toPostError(error))
  if (!data) return failure("Le statut de ce post a changé : rechargez la page.")

  revalidatePost(postId)
  return { ok: true, data }
}
