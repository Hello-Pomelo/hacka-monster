"use server"

// Server Actions des séries (spec Création de post, E1 « Générer avec l'IA » et E2).

import { revalidatePath } from "next/cache"

import {
  newPostInputSchema,
  seriesFormInputSchema,
  type ActionResult,
  type LineOption,
  type NewPostInput,
  type SeriesFormInput,
} from "@/lib/creation"
import {
  SIGNED_OUT_MESSAGE,
  consumePrefillSource,
  failure,
  getActionSession,
  getCharterSnapshot,
  getLines,
  zodFailure,
} from "@/lib/creation-data"
import { checkGuardrails, firstBlockingMessage } from "@/lib/guardrails"
import {
  PARIS_TIME_ZONE,
  defaultParamsFor,
  initialSchedule,
  parseSeriesSettings,
  planSeries,
  todayInParis,
  type SchedulePlan,
  type SeriesSettings,
} from "@/lib/series"

// Ligne figée sur la série à la génération (spec Paramétrage, section 4).
const LINE_SNAPSHOT_COLUMNS =
  "id, code, name, configured, brand, about, core_values, targets, voice_adjectives, we_are, we_are_not, pillars, target_per_week, defaults, reference_posts, version, updated_at"

const PLAN_ERROR_FIELDS = ["startDate", "endDate", "count", "time", "series"] as const

// E1 « Générer avec l'IA » : crée la série avec ses réglages initiaux, puis ouvre E2.
export async function createSeries(input: NewPostInput): Promise<ActionResult<{ seriesId: string }>> {
  const parsed = newPostInputSchema.safeParse(input)
  if (!parsed.success) return zodFailure(parsed.error)
  const { type, subject, brief, answers, lineId, date, ideaId, suggestionKey } = parsed.data
  if (parsed.data.mode !== "ai") return failure("Mode de création invalide.")

  const session = await getActionSession()
  if (!session) return failure(SIGNED_OUT_MESSAGE)

  let lines: LineOption[]
  try {
    lines = await getLines()
  } catch {
    return failure("Les lignes éditoriales n'ont pas pu être lues. Réessayez.")
  }
  const line = lines.find((option) => option.id === lineId) ?? lines.find((option) => option.code === "neutre")

  const settings: SeriesSettings = {
    params: defaultParamsFor(type, line?.defaults ?? null),
    ...initialSchedule(type, { today: todayInParis(), prefillDate: date }),
    answers,
    timeZone: PARIS_TIME_ZONE,
    source: { ideaId, suggestionKey },
  }

  const { data, error } = await session.supabase
    .from("series")
    .insert({
      created_by: session.userId,
      type,
      subject,
      brief,
      editorial_line_id: line?.id ?? null,
      settings,
    })
    .select("id")
    .single()
  if (error) return failure("La série n'a pas pu être créée. Réessayez.")

  return { ok: true, data: { seriesId: data.id } }
}

function firstPlanError(plan: SchedulePlan): { field: string; message: string } | null {
  for (const field of PLAN_ERROR_FIELDS) {
    const message = plan.errors[field]
    if (message) return { field, message }
  }
  return null
}

// E2 « Générer » : fige les réglages, la ligne et la charte sur la série, puis crée un Brouillon
// vide par date prévue. Les textes sont écrits ensuite, un par un, dans E3. Sans effet si la série
// a déjà ses posts : leurs identifiants sont renvoyés.
export async function generateSeriesPosts(input: SeriesFormInput): Promise<ActionResult<{ postIds: string[] }>> {
  const parsed = seriesFormInputSchema.safeParse(input)
  if (!parsed.success) return zodFailure(parsed.error)
  const { seriesId, type, subject, brief, answers, lineId, params, schedule, slotTouched } = parsed.data

  const session = await getActionSession()
  if (!session) return failure(SIGNED_OUT_MESSAGE)
  const { supabase, userId } = session

  const [seriesResult, existingResult] = await Promise.all([
    supabase.from("series").select("id, settings").eq("id", seriesId).maybeSingle(),
    supabase
      .from("posts")
      .select("id")
      .eq("series_id", seriesId)
      .order("scheduled_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
  ])
  if (seriesResult.error || existingResult.error) return failure("La série n'a pas pu être lue. Réessayez.")
  if (!seriesResult.data) return failure("Série introuvable.")
  if (existingResult.data.length > 0) {
    return { ok: true, data: { postIds: existingResult.data.map((post) => post.id) } }
  }

  // Un client non citable dans la matière bloque avant tout appel au modèle.
  let charter: Awaited<ReturnType<typeof getCharterSnapshot>>
  try {
    charter = await getCharterSnapshot()
  } catch {
    return failure("La charte n'a pas pu être lue. Réessayez.")
  }
  const blocking = firstBlockingMessage(
    checkGuardrails([subject, brief, ...Object.values(answers)].join("\n"), charter.rules, { scope: "brief" })
  )
  if (blocking) return failure(blocking, { field: "brief" })

  const plan = planSeries(schedule)
  const planError = firstPlanError(plan)
  if (planError) return failure(planError.message, { field: planError.field })

  const { data: line, error: lineError } = await supabase
    .from("editorial_lines")
    .select(LINE_SNAPSHOT_COLUMNS)
    .eq("id", lineId)
    .maybeSingle()
  if (lineError) return failure("La ligne éditoriale n'a pas pu être lue. Réessayez.")
  if (!line) return failure("Ligne éditoriale introuvable.", { field: "lineId" })

  const previous = parseSeriesSettings(seriesResult.data.settings, {
    params,
    schedule,
    slotTouched,
    answers,
    timeZone: PARIS_TIME_ZONE,
    source: {},
  })
  const settings: SeriesSettings = {
    params,
    schedule,
    slotTouched,
    answers,
    timeZone: PARIS_TIME_ZONE,
    source: previous.source,
  }

  const { error: seriesError } = await supabase
    .from("series")
    .update({
      type,
      subject,
      brief,
      editorial_line_id: lineId,
      settings,
      line_snapshot: line,
      charter_snapshot: charter.snapshot,
    })
    .eq("id", seriesId)
  if (seriesError) return failure("La série n'a pas pu être enregistrée. Réessayez.")

  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .insert(
      plan.posts.map((planned) => ({
        author_id: userId,
        type,
        sujet: subject,
        answers,
        params,
        series_id: seriesId,
        editorial_line_id: lineId,
        scheduled_at: planned.iso,
        cible: "entreprise" as const,
      }))
    )
    .select("id, scheduled_at")
  if (postsError) return failure("Les posts de la série n'ont pas pu être créés. Réessayez.")

  await consumePrefillSource(supabase, previous.source)
  revalidatePath("/")
  revalidatePath("/posts")

  const postIds = [...posts]
    .sort((a, b) => Date.parse(a.scheduled_at ?? "") - Date.parse(b.scheduled_at ?? ""))
    .map((post) => post.id)
  return { ok: true, data: { postIds } }
}
