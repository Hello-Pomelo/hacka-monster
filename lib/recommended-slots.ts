// Créneaux conseillés par type de post (spec Créneaux conseillés, matrice). Repères généraux
// d'usage de LinkedIn, à valider par les admins Marketing et RH. Heures de Paris.

import type { PostTypeId } from "@/lib/post-types"
import { WEEKDAY_LABELS, addDaysToDay, formatParisTime, weekdayOf, type Weekday } from "@/lib/series"

export type RecommendedSlot = {
  // null : aucun jour conseillé (la date dépend de l'événement).
  weekday: Weekday | null
  time: string
  reason: string
  // Complément de « Créneau conseillé pour … ».
  subject: string
}

export const RECOMMENDED_SLOTS: Record<PostTypeId, RecommendedSlot> = {
  newcomer: {
    weekday: 2,
    time: "08:00",
    reason: "Un post court se lit bien tôt le matin, en début de semaine active.",
    subject: "l'arrivée d'un collaborateur",
  },
  project_delivered: {
    weekday: 4,
    time: "10:30",
    reason: "Le jeudi en fin de matinée est l'un des moments les plus actifs sur LinkedIn.",
    subject: "un projet livré",
  },
  tech_feedback: {
    weekday: 4,
    time: "12:30",
    reason: "Un contenu dense se lit plus volontiers à la pause déjeuner.",
    subject: "un retour d'expérience technique",
  },
  employer_brand: {
    weekday: 3,
    time: "12:30",
    reason: "Les récits d'équipe se lisent bien à la pause déjeuner.",
    subject: "un post marque employeur",
  },
  hiring: {
    weekday: 2,
    time: "17:00",
    reason: "En fin de journée, les lecteurs répondent plus aux appels à l'action.",
    subject: "un recrutement",
  },
  event: {
    weekday: null,
    time: "10:30",
    reason: "La date dépend de l'événement. La fin de matinée reste un moment actif.",
    subject: "un événement",
  },
}

export const RECOMMENDED_SLOT_TOOLTIP = "Repères généraux d'usage de LinkedIn, pas une mesure de votre page."

// Prochain jour conseillé à partir de demain ; null pour un type sans jour conseillé.
export function nextRecommendedDate(type: PostTypeId, today: string): string | null {
  const { weekday } = RECOMMENDED_SLOTS[type]
  if (weekday === null) return null
  const tomorrow = addDaysToDay(today, 1)
  return addDaysToDay(tomorrow, (weekday - weekdayOf(tomorrow) + 7) % 7)
}

export function slotMatches(type: PostTypeId, weekday: Weekday, time: string): boolean {
  const slot = RECOMMENDED_SLOTS[type]
  return slot.time === time && (slot.weekday === null || slot.weekday === weekday)
}

// « jeudi 10 h 30 », ou « 10 h 30 » sans jour conseillé.
export function slotLabel(type: PostTypeId): string {
  const slot = RECOMMENDED_SLOTS[type]
  const time = formatParisTime(slot.time)
  return slot.weekday === null ? time : `${WEEKDAY_LABELS[slot.weekday]} ${time}`
}

export function recommendedSlotSentence(type: PostTypeId, matches: boolean): string {
  const slot = RECOMMENDED_SLOTS[type]
  const lead = matches ? `Créneau conseillé pour ${slot.subject}` : "Créneau conseillé"
  return `${lead} : ${slotLabel(type)}. ${slot.reason}`
}
