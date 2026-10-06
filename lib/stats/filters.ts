import { z } from "zod"

import { LINE_FILTERS } from "@/lib/calendar"

// Filtres de l'écran Statistiques, portés par l'URL (?periode=90j&ligne=toutes),
// avec le même filtre par ligne éditoriale que le calendrier.

export const PERIODS = {
  "30j": { label: "30 jours", days: 30, current: "les 30 derniers jours", previous: "les 30 jours précédents" },
  "90j": { label: "90 jours", days: 90, current: "les 90 derniers jours", previous: "les 90 jours précédents" },
  "12m": { label: "12 mois", days: 365, current: "les 12 derniers mois", previous: "les 12 mois précédents" },
} as const

export type PeriodId = keyof typeof PERIODS

export const PERIOD_IDS = Object.keys(PERIODS) as PeriodId[]

// Une valeur absente ou inconnue retombe sur le défaut : un lien partagé reste valide.
export const statsFiltersSchema = z.object({
  periode: z.enum(["30j", "90j", "12m"]).catch("90j"),
  ligne: z.enum(LINE_FILTERS).catch("toutes"),
})

export type StatsFilters = z.infer<typeof statsFiltersSchema>

const DAY_MS = 24 * 60 * 60 * 1000

// Période glissante qui se termine maintenant, et période précédente de même durée.
export function getPeriodRange(period: PeriodId, now: Date) {
  const length = PERIODS[period].days * DAY_MS
  const end = now
  const start = new Date(end.getTime() - length)
  const previousStart = new Date(start.getTime() - length)
  return { start, end, previousStart }
}
