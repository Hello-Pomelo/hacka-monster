import "server-only"

// Lectures de la piste Création de post (Server Components et Server Actions), et outils
// communs aux Server Actions. Le jeton LinkedIn chiffré n'est jamais lu.

import { z } from "zod"

import {
  EDITOR_POST_COLUMNS,
  type ActionResult,
  type EditorPost,
  type LineCode,
  type LineOption,
  type LinkedInConnectionSummary,
  type SeriesSummary,
} from "@/lib/creation"
import { EMPTY_CHARTER, type CharterClient, type CharterRules } from "@/lib/guardrails"
import { POST_TYPE_IDS, isPostTypeId } from "@/lib/post-types"
import { postParamsSchema, type PostParams, type PostStatus } from "@/lib/posts"
import {
  PARIS_TIME_ZONE,
  defaultParamsFor,
  initialSchedule,
  parseSeriesSettings,
  todayInParis,
  type SeriesSettings,
} from "@/lib/series"
import { getCurrentProfile } from "@/lib/supabase/auth"
import type { Json, Tables } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

type ServerSupabase = Awaited<ReturnType<typeof createClient>>

// Outils des Server Actions ----------------------------------------------

export type ActionFailure = Extract<ActionResult, { ok: false }>

export function failure(
  error: string,
  extra: { field?: string; code?: "not_connected" } = {}
): ActionFailure {
  return { ok: false, error, ...extra }
}

// Première erreur zod, avec le champ concerné (« startDate » pour « schedule.startDate »).
export function zodFailure(error: z.ZodError): ActionFailure {
  const issue = error.issues[0]
  const path = issue?.path[0] === "schedule" ? issue.path[1] : issue?.path[0]
  return failure(issue?.message ?? "Données invalides.", path === undefined ? {} : { field: String(path) })
}

export const SIGNED_OUT_MESSAGE = "Connectez-vous pour continuer."

// Client Supabase et identifiant de l'utilisateur connecté, ou null sans session.
export async function getActionSession(): Promise<{ supabase: ServerSupabase; userId: string } | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims.sub
  return userId ? { supabase, userId } : null
}

// Une idée ou une suggestion reprise par un post est consommée. Échec sans conséquence.
export async function consumePrefillSource(
  supabase: ServerSupabase,
  source: { ideaId?: string; suggestionKey?: string }
): Promise<void> {
  if (source.ideaId) await supabase.from("ideas").delete().eq("id", source.ideaId)
  if (source.suggestionKey) {
    await supabase
      .from("dismissed_suggestions")
      .upsert({ suggestion_key: source.suggestionKey }, { onConflict: "suggestion_key", ignoreDuplicates: true })
  }
}

// Charte -------------------------------------------------------------------

const CHARTER_COLUMNS = "banned_expressions, sensitive_topics, address_form, inclusive_writing, version, updated_at"

type CharterSnapshot = {
  charter: Pick<
    Tables<"charter">,
    "banned_expressions" | "sensitive_topics" | "address_form" | "inclusive_writing" | "version" | "updated_at"
  > | null
  clients: CharterClient[]
}

// Charte active et sa copie figée sur une série (`series.charter_snapshot`). Lève une erreur si
// la lecture échoue : un garde-fou ne passe jamais faute de charte.
export async function getCharterSnapshot(): Promise<{ rules: CharterRules; snapshot: CharterSnapshot }> {
  const supabase = await createClient()
  const [charterResult, clientsResult] = await Promise.all([
    supabase.from("charter").select(CHARTER_COLUMNS).eq("id", 1).maybeSingle(),
    supabase.from("charter_clients").select("name, aliases, status").order("name"),
  ])
  if (charterResult.error || clientsResult.error) throw new Error("Lecture de la charte impossible.")

  const charter = charterResult.data
  const clients = clientsResult.data
  return {
    rules: {
      bannedExpressions: charter?.banned_expressions ?? EMPTY_CHARTER.bannedExpressions,
      sensitiveTopics: charter?.sensitive_topics ?? EMPTY_CHARTER.sensitiveTopics,
      addressForm: charter?.address_form === "tu" ? "tu" : "vous",
      clients,
    },
    snapshot: { charter, clients },
  }
}

export async function getCharterRules(): Promise<CharterRules> {
  return (await getCharterSnapshot()).rules
}

// Connexion LinkedIn (contrat 4) ---------------------------------------------

// null : aucune page connectée. Lève une erreur si la lecture échoue.
export async function getLinkedInConnection(): Promise<LinkedInConnectionSummary | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("linkedin_connection")
    .select("mode, target_name, target_logo_url, expires_at")
    .eq("id", 1)
    .maybeSingle()
  if (error) throw new Error("Lecture de la connexion LinkedIn impossible.")
  if (!data) return null

  return {
    mode: data.mode === "demo" ? "demo" : "linkedin",
    targetName: data.target_name,
    targetLogoUrl: data.target_logo_url,
    expiresAt: data.expires_at,
  }
}

// Lignes éditoriales ---------------------------------------------------------

const LINE_ORDER: LineCode[] = ["marketing", "rh", "neutre"]

function toLineCode(code: string | null | undefined): LineCode | null {
  return LINE_ORDER.find((lineCode) => lineCode === code) ?? null
}

// Réglages par défaut d'une ligne : seules les clés valides sont gardées.
function parseLineDefaults(json: Json): Partial<PostParams> {
  if (typeof json !== "object" || json === null || Array.isArray(json)) return {}
  const shape = postParamsSchema.shape
  const defaults: Partial<PostParams> = {}
  const tone = shape.tone.safeParse(json.tone)
  if (tone.success) defaults.tone = tone.data
  const length = shape.length.safeParse(json.length)
  if (length.success) defaults.length = length.data
  const emojis = shape.emojis.safeParse(json.emojis)
  if (emojis.success) defaults.emojis = emojis.data
  const hashtags = shape.hashtags.safeParse(json.hashtags)
  if (hashtags.success) defaults.hashtags = hashtags.data
  const cta = shape.cta.safeParse(json.cta)
  if (cta.success) defaults.cta = cta.data
  return defaults
}

// Lignes Marketing, RH puis Neutre. Lève une erreur si la lecture échoue.
export async function getLines(): Promise<LineOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("editorial_lines").select("id, code, name, configured, defaults")
  if (error) throw new Error("Lecture des lignes éditoriales impossible.")

  return data
    .flatMap((row): LineOption[] => {
      const code = toLineCode(row.code)
      return code
        ? [{ id: row.id, code, name: row.name, configured: row.configured, defaults: parseLineDefaults(row.defaults) }]
        : []
    })
    .sort((a, b) => LINE_ORDER.indexOf(a.code) - LINE_ORDER.indexOf(b.code))
}

// Écrans ----------------------------------------------------------------------

export async function getNewPostContext(): Promise<{
  lines: LineOption[]
  profileLineId: string | null
  connection: LinkedInConnectionSummary | null
} | null> {
  try {
    const [lines, profile, connection] = await Promise.all([
      getLines(),
      getCurrentProfile(),
      getLinkedInConnection(),
    ])
    return { lines, profileLineId: profile?.line_id ?? null, connection }
  } catch {
    return null
  }
}

function toSeriesSummary(
  row: Pick<Tables<"series">, "id" | "subject" | "brief" | "type" | "editorial_line_id">
): SeriesSummary {
  return {
    id: row.id,
    subject: row.subject,
    brief: row.brief,
    type: row.type,
    editorialLineId: row.editorial_line_id,
  }
}

const SERIES_COLUMNS = "id, subject, brief, type, editorial_line_id"

// null : série introuvable. Lève une erreur si une lecture échoue (écran d'erreur de la route).
export async function getSeriesFormData(seriesId: string): Promise<{
  series: SeriesSummary
  settings: SeriesSettings
  firstPostId: string | null
  lines: LineOption[]
  profileLineId: string | null
  charter: CharterRules
  connection: LinkedInConnectionSummary | null
} | null> {
  if (!z.uuid().safeParse(seriesId).success) return null

  const supabase = await createClient()
  const [seriesResult, firstPostResult, lines, profile, charter, connection] = await Promise.all([
    supabase.from("series").select(`${SERIES_COLUMNS}, settings`).eq("id", seriesId).maybeSingle(),
    supabase
      .from("posts")
      .select("id")
      .eq("series_id", seriesId)
      .order("scheduled_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .limit(1),
    getLines(),
    getCurrentProfile(),
    getCharterRules(),
    getLinkedInConnection(),
  ])
  if (seriesResult.error || firstPostResult.error) throw new Error("Lecture de la série impossible.")
  if (!seriesResult.data) return null

  const series = seriesResult.data
  const type = isPostTypeId(series.type) ? series.type : POST_TYPE_IDS[0]
  const line = lines.find((option) => option.id === series.editorial_line_id) ?? null
  const fallback: SeriesSettings = {
    params: defaultParamsFor(type, line?.defaults ?? null),
    ...initialSchedule(type, { today: todayInParis() }),
    answers: {},
    timeZone: PARIS_TIME_ZONE,
    source: {},
  }

  return {
    series: toSeriesSummary(series),
    settings: parseSeriesSettings(series.settings, fallback),
    firstPostId: firstPostResult.data[0]?.id ?? null,
    lines,
    profileLineId: profile?.line_id ?? null,
    charter,
    connection,
  }
}

// null : post introuvable. Lève une erreur si une lecture échoue (écran d'erreur de la route).
export async function getPostWorkspace(postId: string): Promise<{
  post: EditorPost
  seriesPosts: EditorPost[]
  series: SeriesSummary | null
  line: LineOption | null
  charter: CharterRules
  connection: LinkedInConnectionSummary | null
} | null> {
  if (!z.uuid().safeParse(postId).success) return null

  const supabase = await createClient()
  const [postResult, lines, charter, connection] = await Promise.all([
    supabase.from("posts").select(EDITOR_POST_COLUMNS).eq("id", postId).maybeSingle(),
    getLines(),
    getCharterRules(),
    getLinkedInConnection(),
  ])
  if (postResult.error) throw new Error("Lecture du post impossible.")
  const post = postResult.data
  if (!post) return null

  let series: SeriesSummary | null = null
  let seriesPosts: EditorPost[] = [post]
  if (post.series_id) {
    const [seriesResult, postsResult] = await Promise.all([
      supabase.from("series").select(SERIES_COLUMNS).eq("id", post.series_id).maybeSingle(),
      supabase
        .from("posts")
        .select(EDITOR_POST_COLUMNS)
        .eq("series_id", post.series_id)
        .order("scheduled_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true }),
    ])
    if (seriesResult.error || postsResult.error) throw new Error("Lecture de la série impossible.")
    series = seriesResult.data ? toSeriesSummary(seriesResult.data) : null
    seriesPosts = postsResult.data
  }

  const lineId = post.editorial_line_id ?? series?.editorialLineId ?? null
  const line = lines.find((option) => option.id === lineId) ?? null
  return { post, seriesPosts, series, line, charter, connection }
}

// Liste des posts (E6) ----------------------------------------------------------

export type PostListRow = Pick<
  EditorPost,
  | "id"
  | "status"
  | "validated_at"
  | "content"
  | "sujet"
  | "scheduled_at"
  | "published_at"
  | "image_path"
  | "origin"
  | "series_id"
  | "failure_reason"
> & {
  createdAt: string
  seriesSubject: string | null
  lineCode: LineCode | null
  lineName: string | null
}

export type PostListFilters = {
  status: PostStatus | null
  line: "toutes" | "marketing" | "rh"
}

const LISTED_STATUSES: PostStatus[] = ["draft", "scheduled", "publishing", "published", "failed"]

// Date affichée et triée : publication réelle pour un post Publié, sinon date prévue.
function listDate(row: PostListRow): number | null {
  const date = row.status === "published" ? (row.published_at ?? row.scheduled_at) : row.scheduled_at
  return date ? Date.parse(date) : null
}

// Prochaines publications d'abord (de la plus proche à la plus lointaine), puis les dates passées
// de la plus récente à la plus ancienne, puis les posts sans date.
function compareRows(now: number) {
  return (a: PostListRow, b: PostListRow): number => {
    const dateA = listDate(a)
    const dateB = listDate(b)
    if (dateA === null || dateB === null) {
      if (dateA !== dateB) return dateA === null ? 1 : -1
      return Date.parse(b.createdAt) - Date.parse(a.createdAt)
    }
    const upcomingA = dateA >= now
    const upcomingB = dateB >= now
    if (upcomingA !== upcomingB) return upcomingA ? -1 : 1
    return upcomingA ? dateA - dateB : dateB - dateA
  }
}

// Tous les posts de la page, quel que soit l'admin (D27). Sans statut : tous sauf Archivé et En relecture.
export async function listPosts(
  filters: PostListFilters
): Promise<{ rows: PostListRow[]; failedCount: number } | null> {
  try {
    const supabase = await createClient()

    let lineId: string | null = null
    if (filters.line !== "toutes") {
      const { data, error } = await supabase
        .from("editorial_lines")
        .select("id")
        .eq("code", filters.line)
        .maybeSingle()
      if (error) return null
      if (!data) return { rows: [], failedCount: 0 }
      lineId = data.id
    }

    let query = supabase
      .from("posts")
      .select(
        "id, status, validated_at, content, sujet, scheduled_at, published_at, image_path, origin, series_id, failure_reason, created_at, series(subject), editorial_lines(code, name)"
      )
      .limit(1000)
    query = filters.status ? query.eq("status", filters.status) : query.in("status", LISTED_STATUSES)
    if (lineId) query = query.eq("editorial_line_id", lineId)

    const [postsResult, failedResult] = await Promise.all([
      query,
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "failed"),
    ])
    if (postsResult.error || failedResult.error) return null

    const rows = postsResult.data.map(
      ({ created_at, series, editorial_lines, ...row }): PostListRow => ({
        ...row,
        createdAt: created_at,
        seriesSubject: series?.subject ?? null,
        lineCode: toLineCode(editorial_lines?.code),
        lineName: editorial_lines?.name ?? null,
      })
    )
    return { rows: rows.sort(compareRows(Date.now())), failedCount: failedResult.count ?? 0 }
  } catch {
    return null
  }
}
