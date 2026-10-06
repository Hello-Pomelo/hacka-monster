// Calendrier d'une série (spec Création de post E2, spec Créneaux conseillés) : réglages enregistrés
// dans `series.settings`, calcul des dates prévues et conversions heure de Paris / UTC.
// Les dates sont des clés « YYYY-MM-DD » du calendrier de Paris, les heures « HH:MM ».

import { z } from "zod"

import { POST_TYPES, type PostParams, type PostTypeId } from "@/lib/post-types"
import { DEFAULT_PARAMS, parsePostParams, postParamsSchema } from "@/lib/posts"
import { RECOMMENDED_SLOTS, nextRecommendedDate } from "@/lib/recommended-slots"

export const PARIS_TIME_ZONE = "Europe/Paris"
export const SERIES_MAX_POSTS = 20
export const SERIES_MAX_DAYS = 60

// Repris dans CREATION_TEXTS (lib/creation.ts), qui importe ce module.
export const SERIES_TOO_LONG_MESSAGE =
  "Une série est limitée à 20 posts sur 60 jours. Revenez plus tard pour programmer la suite."
export const START_DATE_PAST_MESSAGE = "Choisissez une date de début à venir."

export const FREQUENCY_IDS = ["workdays", "weekly", "biweekly", "monthly"] as const
export type Frequency = (typeof FREQUENCY_IDS)[number]
export const FREQUENCY_LABELS: Record<Frequency, string> = {
  workdays: "Quotidienne (jours ouvrés)",
  weekly: "Hebdomadaire",
  biweekly: "Toutes les 2 semaines",
  monthly: "Mensuelle",
}

// Jours ISO : 1 = lundi, 7 = dimanche.
export const WEEKDAY_IDS = [1, 2, 3, 4, 5, 6, 7] as const
export type Weekday = (typeof WEEKDAY_IDS)[number]
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  1: "lundi",
  2: "mardi",
  3: "mercredi",
  4: "jeudi",
  5: "vendredi",
  6: "samedi",
  7: "dimanche",
}

export const DEFAULT_POST_COUNT: Record<PostTypeId, number> = {
  newcomer: 1,
  project_delivered: 1,
  event: 1,
  hiring: 1,
  tech_feedback: 4,
  employer_brand: 4,
}

function isRealDay(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  )
}

export const dayKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.")
  .refine(isRealDay, "Date invalide.")

export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide.")

export const seriesScheduleSchema = z.object({
  frequency: z.enum(FREQUENCY_IDS),
  weekday: z.literal(WEEKDAY_IDS),
  time: timeSchema,
  startDate: dayKeySchema,
  endMode: z.enum(["count", "endDate"]),
  count: z.number().int().min(1).max(SERIES_MAX_POSTS),
  endDate: dayKeySchema.nullable(),
})
export type SeriesSchedule = z.infer<typeof seriesScheduleSchema>

// Champs du créneau modifiés par l'admin : l'outil ne les remplit plus jamais (Créneaux P0-1).
export const slotTouchedSchema = z.object({
  weekday: z.boolean(),
  time: z.boolean(),
  startDate: z.boolean(),
})
export type SlotTouched = z.infer<typeof slotTouchedSchema>

export const seriesSettingsSchema = z.object({
  params: postParamsSchema,
  schedule: seriesScheduleSchema,
  slotTouched: slotTouchedSchema,
  answers: z.record(z.string(), z.string()),
  timeZone: z.literal(PARIS_TIME_ZONE),
  source: z.object({
    ideaId: z.uuid().optional(),
    suggestionKey: z.string().optional(),
  }),
})
export type SeriesSettings = z.infer<typeof seriesSettingsSchema>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

// Réponses aux questions guidées lues en base : seules les valeurs texte sont gardées.
export function parseAnswers(json: unknown): Record<string, string> {
  if (!isRecord(json)) return {}
  return Object.fromEntries(
    Object.entries(json).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  )
}

// Lecture tolérante de `series.settings` : chaque champ absent ou invalide prend la valeur de `fallback`.
export function parseSeriesSettings(json: unknown, fallback: SeriesSettings): SeriesSettings {
  const source = isRecord(json) ? json : {}
  const schedule = isRecord(source.schedule) ? source.schedule : {}
  const touched = isRecord(source.slotTouched) ? source.slotTouched : {}
  const origin = isRecord(source.source) ? source.source : {}
  const scheduleShape = seriesScheduleSchema.shape
  const touchedShape = slotTouchedSchema.shape

  return {
    params: parsePostParams(source.params, fallback.params),
    schedule: {
      frequency: scheduleShape.frequency.catch(fallback.schedule.frequency).parse(schedule.frequency),
      weekday: scheduleShape.weekday.catch(fallback.schedule.weekday).parse(schedule.weekday),
      time: scheduleShape.time.catch(fallback.schedule.time).parse(schedule.time),
      startDate: scheduleShape.startDate.catch(fallback.schedule.startDate).parse(schedule.startDate),
      endMode: scheduleShape.endMode.catch(fallback.schedule.endMode).parse(schedule.endMode),
      count: scheduleShape.count.catch(fallback.schedule.count).parse(schedule.count),
      endDate: scheduleShape.endDate.catch(fallback.schedule.endDate).parse(schedule.endDate),
    },
    slotTouched: {
      weekday: touchedShape.weekday.catch(fallback.slotTouched.weekday).parse(touched.weekday),
      time: touchedShape.time.catch(fallback.slotTouched.time).parse(touched.time),
      startDate: touchedShape.startDate.catch(fallback.slotTouched.startDate).parse(touched.startDate),
    },
    answers: isRecord(source.answers) ? parseAnswers(source.answers) : fallback.answers,
    timeZone: PARIS_TIME_ZONE,
    source: {
      ideaId: z.uuid().optional().catch(fallback.source.ideaId).parse(origin.ideaId),
      suggestionKey: z
        .string()
        .optional()
        .catch(fallback.source.suggestionKey)
        .parse(origin.suggestionKey),
    },
  }
}

// Dates et heures -------------------------------------------------------

const pad = (value: number) => String(value).padStart(2, "0")

function toDayKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`
}

function parseDay(day: string): [number, number, number] {
  const [year, month, date] = day.split("-").map(Number)
  return [year, month, date]
}

function parseTime(time: string): [number, number] {
  const [hours, minutes] = time.split(":").map(Number)
  return [hours, minutes]
}

const parisPartsFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: PARIS_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})

function parisParts(date: Date) {
  const parts = parisPartsFormat.formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0)
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  }
}

// Décalage de Paris avec UTC à cet instant, en minutes (60 l'hiver, 120 l'été).
function parisOffsetMinutes(date: Date): number {
  const parts = parisParts(date)
  const wallClock = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  const instant = date.getTime() - date.getUTCMilliseconds()
  return Math.round((wallClock - instant) / 60_000)
}

export function todayInParis(now: Date = new Date()): string {
  const parts = parisParts(now)
  return toDayKey(parts.year, parts.month, parts.day)
}

export function addDaysToDay(day: string, n: number): string {
  const [year, month, date] = parseDay(day)
  return new Date(Date.UTC(year, month - 1, date + n)).toISOString().slice(0, 10)
}

export function weekdayOf(day: string): Weekday {
  const [year, month, date] = parseDay(day)
  const weekday = new Date(Date.UTC(year, month - 1, date)).getUTCDay()
  return (weekday === 0 ? 7 : weekday) as Weekday
}

// Heure de Paris à cette date, convertie en instant UTC. Le décalage est lu à la date du post,
// puis corrigé une fois si l'instant obtenu tombe de l'autre côté d'un changement d'heure.
export function parisDateTimeToIso(day: string, time: string): string {
  const [year, month, date] = parseDay(day)
  const [hours, minutes] = parseTime(time)
  const wallClock = Date.UTC(year, month - 1, date, hours, minutes)
  const firstGuess = wallClock - parisOffsetMinutes(new Date(wallClock)) * 60_000
  const instant = wallClock - parisOffsetMinutes(new Date(firstGuess)) * 60_000
  return new Date(instant).toISOString()
}

export function isoToParis(iso: string): { day: string; time: string } {
  const parts = parisParts(new Date(iso))
  return {
    day: toDayKey(parts.year, parts.month, parts.day),
    time: `${pad(parts.hour)}:${pad(parts.minute)}`,
  }
}

// « 08:30 » devient « 8 h 30 ».
export function formatParisTime(time: string): string {
  const [hours, minutes] = parseTime(time)
  return `${hours} h ${pad(minutes)}`
}

const dayLongFormat = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
})
const dayShortFormat = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
})

function dayAsDate(day: string): Date {
  const [year, month, date] = parseDay(day)
  return new Date(Date.UTC(year, month - 1, date, 12))
}

// « jeudi 8 octobre · 10 h 30 »
export function formatPlannedDate(day: string, time: string): string {
  return `${dayLongFormat.format(dayAsDate(day))} · ${formatParisTime(time)}`
}

// « jeu. 8 oct. · 10 h 30 »
export function formatPlannedDateShort(day: string, time: string): string {
  return `${dayShortFormat.format(dayAsDate(day))} · ${formatParisTime(time)}`
}

// Mention de l'heure locale quand l'ordinateur n'est pas à l'heure de Paris (Créneaux P0-3).
// Lit le fuseau du navigateur : à appeler côté client uniquement.
export function localTimeMention(day: string, time: string): string | null {
  if (!dayKeySchema.safeParse(day).success || !timeSchema.safeParse(time).success) return null

  const instant = new Date(parisDateTimeToIso(day, time))
  if (-instant.getTimezoneOffset() === parisOffsetMinutes(instant)) return null

  const localTime = `${pad(instant.getHours())}:${pad(instant.getMinutes())}`
  const localDay = toDayKey(instant.getFullYear(), instant.getMonth() + 1, instant.getDate())
  const mention = `${formatParisTime(time)} à Paris, soit ${formatParisTime(localTime)} chez vous`
  return localDay === day ? `${mention}.` : `${mention}, le ${dayLongFormat.format(dayAsDate(localDay))}.`
}

// Calcul des dates prévues -----------------------------------------------

export type PlannedPost = { day: string; time: string; iso: string }

export type SchedulePlan = {
  posts: PlannedPost[]
  errors: Partial<Record<"startDate" | "endDate" | "count" | "time" | "series", string>>
}

function firstOnOrAfter(day: string, weekday: Weekday): string {
  return addDaysToDay(day, (weekday - weekdayOf(day) + 7) % 7)
}

function addMonthsClamped(day: string, months: number): string {
  const [year, month, date] = parseDay(day)
  const target = new Date(Date.UTC(year, month - 1 + months, 1))
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  return toDayKey(target.getUTCFullYear(), target.getUTCMonth() + 1, Math.min(date, lastDay))
}

// Jours de publication successifs, sans fin : l'appelant arrête l'itération.
function* publicationDays(schedule: SeriesSchedule): Generator<string> {
  const { frequency, weekday, startDate } = schedule
  if (frequency === "workdays") {
    for (let day = startDate; ; day = addDaysToDay(day, 1)) {
      if (weekdayOf(day) <= 5) yield day
    }
  }
  if (frequency === "monthly") {
    for (let month = 0; ; month += 1) yield firstOnOrAfter(addMonthsClamped(startDate, month), weekday)
  }
  const step = frequency === "biweekly" ? 14 : 7
  for (let day = firstOnOrAfter(startDate, weekday); ; day = addDaysToDay(day, step)) yield day
}

function plannedDays(schedule: SeriesSchedule): string[] {
  if (schedule.endMode === "count" && schedule.count === 1) return [schedule.startDate]

  // Une date de plus que le plafond suffit à détecter le dépassement.
  const limit = SERIES_MAX_POSTS + 1
  const days: string[] = []
  for (const day of publicationDays(schedule)) {
    if (schedule.endMode === "count" && days.length >= Math.min(schedule.count, limit)) break
    if (schedule.endMode === "endDate" && (days.length >= limit || day > (schedule.endDate ?? ""))) break
    days.push(day)
  }
  return days
}

export function planSeries(schedule: SeriesSchedule, now: Date = new Date()): SchedulePlan {
  const errors: SchedulePlan["errors"] = {}

  if (!timeSchema.safeParse(schedule.time).success) errors.time = "Choisissez une heure de publication."
  if (!dayKeySchema.safeParse(schedule.startDate).success) errors.startDate = "Choisissez une date de début."
  if (schedule.endMode === "count" && !(Number.isInteger(schedule.count) && schedule.count >= 1)) {
    errors.count = "Indiquez un nombre de posts entre 1 et 20."
  }
  if (schedule.endMode === "endDate" && !dayKeySchema.safeParse(schedule.endDate).success) {
    errors.endDate = "Choisissez une date de fin."
  }
  if (Object.keys(errors).length > 0) return { posts: [], errors }

  if (schedule.startDate < todayInParis(now)) errors.startDate = START_DATE_PAST_MESSAGE
  if (schedule.endMode === "endDate" && (schedule.endDate ?? "") < schedule.startDate) {
    errors.endDate = "La date de fin doit suivre la date de début."
    return { posts: [], errors }
  }

  const posts = plannedDays(schedule).map((day) => ({
    day,
    time: schedule.time,
    iso: parisDateTimeToIso(day, schedule.time),
  }))

  const first = posts[0]
  const last = posts[posts.length - 1]
  if (!first || !last) {
    errors.endDate = "Aucune date entre le début et la fin : élargissez la période."
    return { posts, errors }
  }
  if (Date.parse(first.iso) <= now.getTime()) errors.startDate = START_DATE_PAST_MESSAGE
  if (posts.length > SERIES_MAX_POSTS || last.day > addDaysToDay(first.day, SERIES_MAX_DAYS)) {
    errors.series = SERIES_TOO_LONG_MESSAGE
  }
  return { posts, errors }
}

// Valeurs initiales -------------------------------------------------------

function definedEntries(values: Partial<PostParams>): Partial<PostParams> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined))
}

// Réglages d'un post : valeurs par défaut, puis ceux de la ligne éditoriale, puis ceux du gabarit.
export function defaultParamsFor(type: PostTypeId, lineDefaults: Partial<PostParams> | null): PostParams {
  return {
    ...DEFAULT_PARAMS,
    ...definedEntries(lineDefaults ?? {}),
    ...definedEntries(POST_TYPES[type].defaults),
  }
}

// Calendrier initial d'une série (Créneaux P0-1). Une date transmise par le calendrier est gardée :
// seule l'heure vient de la matrice.
export function initialSchedule(
  type: PostTypeId,
  opts: { today: string; prefillDate?: string }
): { schedule: SeriesSchedule; slotTouched: SlotTouched } {
  const slot = RECOMMENDED_SLOTS[type]
  const common = {
    frequency: "weekly",
    time: slot.time,
    endMode: "count",
    count: DEFAULT_POST_COUNT[type],
    endDate: null,
  } as const

  if (opts.prefillDate) {
    return {
      schedule: { ...common, startDate: opts.prefillDate, weekday: weekdayOf(opts.prefillDate) },
      slotTouched: { weekday: true, time: false, startDate: true },
    }
  }

  const startDate = nextRecommendedDate(type, opts.today) ?? addDaysToDay(opts.today, 1)
  return {
    schedule: { ...common, startDate, weekday: slot.weekday ?? weekdayOf(startDate) },
    slotTouched: { weekday: false, time: false, startDate: false },
  }
}
