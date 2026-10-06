// Moteur de suggestions de l'accueil (spec Mon calendrier, section 5). Règles Rythme et
// Marque employeur ; Agenda et Recrutement n'ont pas encore de source de données.
// Un jour s'écrit `YYYY-MM-DD`, en heure de Paris.

import type { PostTypeId } from "@/lib/post-types"
import type { Post } from "@/lib/posts"
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
const TEAM_WINDOW_DAYS = 35

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

type SuggestionInput = {
  posts: Pick<Post, "status" | "type" | "published_at" | "scheduled_at" | "editorial_line_id">[]
  lines: Pick<Tables<"editorial_lines">, "id" | "code" | "name" | "target_per_week">[]
  dismissedKeys: string[]
  today: string
}

function isSuggestionLine(code: string): code is SuggestionLineCode {
  return code === "marketing" || code === "rh"
}

export function computeSuggestions({ posts, lines, dismissedKeys, today }: SuggestionInput): Suggestion[] {
  const week = isoWeek(today)
  const suggestions: Suggestion[] = []

  for (const line of lines) {
    if (!isSuggestionLine(line.code) || line.target_per_week <= 0) continue
    const maxGap = 7 / line.target_per_week
    const lastPublished = posts
      .filter((post) => post.editorial_line_id === line.id && post.status === "published")
      .flatMap((post) => (post.published_at ? [parisDay(post.published_at)] : []))
      .sort()
      .at(-1)
    if (lastPublished && daysBetween(lastPublished, today) <= maxGap) continue

    const content = RHYTHM_CONTENT[line.code]
    suggestions.push({
      key: `rhythm:${line.code}:${week}`,
      reason: "rhythm",
      date: addDays(today, 1),
      lineCode: line.code,
      type: content.type,
      title: "Reprendre la parole cette semaine",
      why: lastPublished
        ? `Dernier post publié sur la ligne ${line.name} le ${formatDayLong(lastPublished)}.`
        : `Aucun post publié sur la ligne ${line.name}.`,
      subject: content.subject,
    })
  }

  const hasRh = lines.some((line) => line.code === "rh")
  const windowStart = addDays(today, -TEAM_WINDOW_DAYS)
  const recentEmployerBrand = posts.some((post) => {
    if (post.type !== "employer_brand") return false
    const at =
      post.status === "published" ? post.published_at : post.status === "scheduled" ? post.scheduled_at : null
    return at !== null && parisDay(at) >= windowStart
  })
  if (hasRh && !recentEmployerBrand) {
    suggestions.push({
      key: `team:rh:${week}`,
      reason: "team",
      date: nextTuesday(today),
      lineCode: "rh",
      type: "employer_brand",
      title: "Montrer les coulisses de l'équipe",
      why: "Aucun post marque employeur publié ou programmé depuis 5 semaines.",
      subject: "Les coulisses de l'équipe",
    })
  }

  const dismissed = new Set(dismissedKeys)
  return suggestions.filter((suggestion) => !dismissed.has(suggestion.key))
}
