// Dates du calendrier d'accueil « Mon calendrier ». Un jour s'écrit `yyyy-mm-dd`, un mois `yyyy-mm`,
// tous deux en heure de Paris. Les calculs sur les jours passent par des dates UTC à minuit,
// indépendantes du fuseau du serveur.

import type { Post } from "@/lib/posts"
import type { Tables } from "@/lib/supabase/database.types"

// Liens fixés entre pistes : connexion LinkedIn (contrat 4), lignes éditoriales (contrat 3),
// premier login (contrat 2).
export const SETTINGS_CONNECTION_HREF = "/parametrage?onglet=connexion"
export const SETTINGS_LINES_HREF = "/parametrage?onglet=lignes"
export const ACCOUNT_HREF = "/compte"
export const ONBOARDING_HREF = "/onboarding"
export const ALL_POSTS_HREF = "/posts"

export function postHref(id: string): string {
  return `/posts/${id}`
}

// Filtre de ligne ; `null` correspond au filtre « Toutes ». Un post sans ligne (importé de LinkedIn,
// post ancien) appartient à l'historique de la page : il passe tous les filtres.
export function postMatchesLine(
  post: Pick<Post, "editorial_line_id">,
  lineIds: ReadonlySet<string> | null
): boolean {
  if (!lineIds || !post.editorial_line_id) return true
  return lineIds.has(post.editorial_line_id)
}

// Bandeau « Ligne éditoriale non configurée » (contrat 3) : pas de ligne, ligne Neutre,
// ou ligne pas encore activée.
export function needsLineSetup(line: Pick<Tables<"editorial_lines">, "code" | "configured"> | null): boolean {
  return !line || line.code === "neutre" || !line.configured
}

const TIME_ZONE = "Europe/Paris"
const DAY_MS = 86_400_000

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

export type CalendarPost = Post & {
  // Jour et heure à Paris : publication pour un post publié, sinon diffusion, sinon création.
  day: string
  time: string
  at: number
}

const parisParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

function partsOf(date: Date) {
  const parts = Object.fromEntries(parisParts.formatToParts(date).map((p) => [p.type, p.value]))
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: parts.minute,
  }
}

// Jour à Paris d'un instant.
export function toDayKey(date: Date): string {
  return partsOf(date).day
}

// Heure à Paris d'un instant, au format « 8 h 30 ».
export function formatTime(date: Date): string {
  const { hour, minute } = partsOf(date)
  return `${hour} h ${minute}`
}

export function toCalendarPost(post: Post): CalendarPost {
  const iso =
    post.status === "published"
      ? (post.published_at ?? post.scheduled_at ?? post.created_at)
      : (post.scheduled_at ?? post.created_at)
  const date = new Date(iso)
  return { ...post, day: toDayKey(date), time: formatTime(date), at: date.getTime() }
}

function fromDayKey(day: string): Date {
  const [y, m, d] = day.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function toKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function isDayKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && toKey(fromDayKey(value)) === value
}

export function isMonthKey(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
}

export function monthOf(day: string): string {
  return day.slice(0, 7)
}

export function addMonths(month: string, count: number): string {
  const [y, m] = month.split("-").map(Number)
  return toKey(new Date(Date.UTC(y, m - 1 + count, 1))).slice(0, 7)
}

export function addDays(day: string, count: number): string {
  return toKey(new Date(fromDayKey(day).getTime() + count * DAY_MS))
}

// Nombre de jours de `from` à `to` (négatif si `to` précède `from`).
export function daysBetween(from: string, to: string): number {
  return Math.round((fromDayKey(to).getTime() - fromDayKey(from).getTime()) / DAY_MS)
}

// Jours affichés pour un mois : semaines complètes, du lundi au dimanche.
export function monthGrid(month: string): string[] {
  const first = fromDayKey(`${month}-01`)
  const offset = (first.getUTCDay() + 6) % 7
  const cells = Math.ceil((offset + daysInMonth(month)) / 7) * 7
  const start = addDays(`${month}-01`, -offset)
  return Array.from({ length: cells }, (_, i) => addDays(start, i))
}

const monthFormat = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" })
const monthNameFormat = new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" })
const monthShortFormat = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" })
const dayLongFormat = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
})
const dayShortFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" })

// « octobre 2026 »
export function formatMonth(month: string): string {
  return monthFormat.format(fromDayKey(`${month}-01`))
}

// « octobre »
export function formatMonthName(month: string): string {
  return monthNameFormat.format(fromDayKey(`${month}-01`))
}

// « oct »
export function formatMonthShort(day: string): string {
  return monthShortFormat.format(fromDayKey(day)).replace(".", "")
}

// « mardi 6 octobre »
export function formatDayLong(day: string): string {
  return dayLongFormat.format(fromDayKey(day))
}

// « 24 sept. »
export function formatDayShort(day: string): string {
  return dayShortFormat.format(fromDayKey(day))
}

export function dayOfMonth(day: string): number {
  return Number(day.slice(8, 10))
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number)
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

export function lastDayOfMonth(month: string): string {
  return `${month}-${String(daysInMonth(month)).padStart(2, "0")}`
}

// Vue de l'accueil portée par l'URL : `?mois=2026-10&jour=2026-10-14&ligne=rh&onglet=idees&suggestions=0`.
export const LINE_FILTERS = ["toutes", "marketing", "rh"] as const
export type LineFilter = (typeof LINE_FILTERS)[number]

export const HOME_TABS = ["suggestions", "a-venir", "idees"] as const
export type HomeTab = (typeof HOME_TABS)[number]

export type HomeView = {
  month: string
  day: string | null
  line: LineFilter
  tab: HomeTab
  showSuggestions: boolean
}

export function homeHref(view: HomeView, changes: Partial<HomeView> = {}): string {
  const next = { ...view, ...changes }
  const params = new URLSearchParams({ mois: next.month })
  if (next.day) params.set("jour", next.day)
  if (next.line !== "toutes") params.set("ligne", next.line)
  if (next.tab !== "suggestions") params.set("onglet", next.tab)
  if (!next.showSuggestions) params.set("suggestions", "0")
  return `/?${params.toString()}`
}
