// Moteur de suggestions de l'accueil (spec Mon calendrier, section 5) : règles Rythme et Marque employeur.
// Agenda et Recrutement n'ont pas de source de données en v1 : ni lecture de l'agenda, ni offres d'emploi.
// Un post sans ligne (importé de LinkedIn) appartient à l'historique de la page et compte pour chaque ligne.
// Un jour s'écrit `YYYY-MM-DD`, en heure de Paris.

import type { PostTypeId } from "@/lib/post-types"
import type { Post, PostStatus } from "@/lib/posts"
import type { Tables } from "@/lib/supabase/database.types"

export type SuggestionLineCode = "marketing" | "rh"

export type Suggestion = {
  key: string
  reason: "rhythm" | "team"
  date: string
  lineCode: SuggestionLineCode
  type: PostTypeId
  title: string
  why: string
  subject: string
}

export const REASON_LABELS: Record<Suggestion["reason"], string> = {
  rhythm: "Rythme",
  team: "Marque employeur",
}

const TIME_ZONE = "Europe/Paris"
const DAY_MS = 86_400_000
const WEEK_DAYS = 7
const TEAM_WINDOW_DAYS = 35
const TEAM_TYPE: PostTypeId = "employer_brand"
// Statuts d'un post qui partira à sa date de diffusion.
const UPCOMING_STATUSES: readonly PostStatus[] = ["scheduled", "publishing"]

const perWeekFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 })

const parisDayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

const parisTimeFormat = new Intl.DateTimeFormat("fr-FR", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hourCycle: "h23",
})

// Jour à Paris d'un instant ISO.
export function parisDay(iso: string): string {
  return parisDayFormat.format(new Date(iso))
}

// Heure à Paris d'un instant ISO, au format « 8 h 30 ».
export function parisTime(iso: string): string {
  const parts = Object.fromEntries(
    parisTimeFormat.formatToParts(new Date(iso)).map((part) => [part.type, part.value])
  )
  return `${Number(parts.hour)} h ${parts.minute}`
}

function fromDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function toDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addDays(day: string, days: number): string {
  return toDay(new Date(fromDay(day).getTime() + days * DAY_MS))
}

function daysBetween(from: string, to: string): number {
  return Math.round((fromDay(to).getTime() - fromDay(from).getTime()) / DAY_MS)
}

// « mardi 13 octobre »
export function formatDayLong(day: string): string {
  return fromDay(day).toLocaleDateString("fr-FR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

// « 13 oct. »
export function formatDayShort(day: string): string {
  return fromDay(day).toLocaleDateString("fr-FR", { timeZone: "UTC", day: "numeric", month: "short" })
}

export function dayOfMonth(day: string): number {
  return fromDay(day).getUTCDate()
}

export function monthShort(day: string): string {
  return fromDay(day).toLocaleDateString("fr-FR", { timeZone: "UTC", month: "short" })
}

// Semaine ISO d'un jour : « 2026-W41 ».
function isoWeek(day: string): string {
  const date = fromDay(day)
  const weekday = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - weekday)
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1)
  const week = Math.ceil(((date.getTime() - yearStart) / DAY_MS + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`
}

// Prochain mardi strictement après `day`.
function nextTuesday(day: string): string {
  const weekday = fromDay(day).getUTCDay()
  const delta = ((2 - weekday + 7) % 7) || 7
  return addDays(day, delta)
}

const RHYTHM_CONTENT: Record<SuggestionLineCode, { type: PostTypeId; subject: string }> = {
  marketing: { type: "project_delivered", subject: "Un projet livré récemment" },
  rh: { type: "employer_brand", subject: "Une journée dans l'équipe" },
}

type SuggestionPost = Pick<Post, "status" | "type" | "published_at" | "scheduled_at" | "editorial_line_id">
type SuggestionLine = Pick<Tables<"editorial_lines">, "id" | "code" | "name" | "target_per_week">

type SuggestionInput = {
  posts: SuggestionPost[]
  lines: SuggestionLine[]
  dismissedKeys: string[]
  today: string
}

function isSuggestionLine(code: string): code is SuggestionLineCode {
  return code === "marketing" || code === "rh"
}

// Jour de publication d'un post publié : `published_at`, sinon `scheduled_at`.
function publishedDay(post: SuggestionPost): string | null {
  const at = post.published_at ?? post.scheduled_at
  return at ? parisDay(at) : null
}

// Jour de diffusion d'un post programmé ou en cours de publication.
function upcomingDay(post: SuggestionPost): string | null {
  return UPCOMING_STATUSES.includes(post.status) && post.scheduled_at ? parisDay(post.scheduled_at) : null
}

// Règle Rythme : le délai depuis le dernier post publié de la ligne dépasse 7 / fréquence cible (D22).
// `posts` n'a pas de `suggestion_key` : un post programmé dans ce délai vaut suggestion traitée.
function rhythmSuggestion(
  line: SuggestionLine & { code: SuggestionLineCode },
  posts: SuggestionPost[],
  today: string,
  week: string
): Suggestion | null {
  const linePosts = posts.filter((post) => post.editorial_line_id === null || post.editorial_line_id === line.id)
  const maxGap = WEEK_DAYS / line.target_per_week

  const lastPublished = linePosts
    .flatMap((post) => {
      const day = post.status === "published" ? publishedDay(post) : null
      return day ? [day] : []
    })
    .sort()
    .at(-1)
  if (lastPublished && daysBetween(lastPublished, today) <= maxGap) return null

  const windowEnd = addDays(today, Math.ceil(maxGap))
  const handled = linePosts.some((post) => {
    const day = upcomingDay(post)
    return day !== null && day >= today && day <= windowEnd
  })
  if (handled) return null

  const content = RHYTHM_CONTENT[line.code]
  const perWeek = perWeekFormat.format(line.target_per_week)
  return {
    key: `rhythm:${line.code}:${week}`,
    reason: "rhythm",
    date: addDays(today, 1),
    lineCode: line.code,
    type: content.type,
    title: "Reprendre la parole cette semaine",
    why: lastPublished
      ? `Dernier post publié le ${formatDayLong(lastPublished)}. Objectif de la ligne ${line.name} : ${perWeek} par semaine.`
      : `Aucun post publié pour la ligne ${line.name}. Objectif : ${perWeek} par semaine.`,
    subject: content.subject,
  }
}

// Règle Marque employeur : aucun post `employer_brand` publié ou programmé depuis 5 semaines.
function teamSuggestion(posts: SuggestionPost[], today: string, week: string): Suggestion | null {
  const windowStart = addDays(today, -TEAM_WINDOW_DAYS)
  const recent = posts.some((post) => {
    if (post.type !== TEAM_TYPE) return false
    const day = post.status === "published" ? publishedDay(post) : upcomingDay(post)
    return day !== null && day >= windowStart
  })
  if (recent) return null

  return {
    key: `team:rh:${week}`,
    reason: "team",
    date: nextTuesday(today),
    lineCode: "rh",
    type: TEAM_TYPE,
    title: "Montrer les coulisses de l'équipe",
    why: "Aucun post marque employeur publié ou programmé depuis 5 semaines.",
    subject: "Les coulisses de l'équipe",
  }
}

export function computeSuggestions({ posts, lines, dismissedKeys, today }: SuggestionInput): Suggestion[] {
  const week = isoWeek(today)
  const suggestions: Suggestion[] = []

  for (const line of lines) {
    const { code } = line
    if (!isSuggestionLine(code) || line.target_per_week <= 0) continue
    const suggestion = rhythmSuggestion({ ...line, code }, posts, today, week)
    if (suggestion) suggestions.push(suggestion)
  }

  if (lines.some((line) => line.code === "rh")) {
    const suggestion = teamSuggestion(posts, today, week)
    if (suggestion) suggestions.push(suggestion)
  }

  const dismissed = new Set(dismissedKeys)
  return suggestions.filter((suggestion) => !dismissed.has(suggestion.key))
}
