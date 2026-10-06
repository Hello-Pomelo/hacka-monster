"use client"

import { useCallback, type Dispatch, type SetStateAction } from "react"

import type { PostTypeId } from "@/lib/post-types"
import { RECOMMENDED_SLOTS, nextRecommendedDate } from "@/lib/recommended-slots"
import type { SeriesSchedule, SlotTouched } from "@/lib/series"

type SlotPrefillOptions = {
  type: PostTypeId
  setSchedule: Dispatch<SetStateAction<SeriesSchedule>>
  slotTouched: SlotTouched
  setSlotTouched: Dispatch<SetStateAction<SlotTouched>>
  // Jour de Paris (« YYYY-MM-DD ») : la date conseillée part de demain.
  today: string
}

// Préremplissage du créneau depuis la matrice (spec Créneaux conseillés, P0 1 et P0 2).
// Un champ modifié par l'admin (jour, heure, date de début) n'est plus jamais rempli par l'outil.
// Une date transmise par le calendrier arrive avec `slotTouched.startDate` à true : elle est gardée.
export function useSlotPrefill({ type, setSchedule, slotTouched, setSlotTouched, today }: SlotPrefillOptions) {
  // Nouveau type : jour, heure et date de début conseillés, sur les seuls champs non modifiés.
  // Événement : la matrice n'a pas de jour, seule l'heure change.
  const onTypeChange = useCallback(
    (next: PostTypeId) => {
      const slot = RECOMMENDED_SLOTS[next]
      const startDate = nextRecommendedDate(next, today)
      setSchedule((current) => ({
        ...current,
        weekday: !slotTouched.weekday && slot.weekday !== null ? slot.weekday : current.weekday,
        time: slotTouched.time ? current.time : slot.time,
        startDate: !slotTouched.startDate && startDate !== null ? startDate : current.startDate,
      }))
    },
    [setSchedule, slotTouched, today]
  )

  const markTouched = useCallback(
    (field: keyof SlotTouched) => {
      setSlotTouched((current) => (current[field] ? current : { ...current, [field]: true }))
    },
    [setSlotTouched]
  )

  // Lien « Utiliser ce créneau » : seul retour à la matrice après une modification. Les champs
  // restent marqués comme modifiés.
  const applyRecommendedSlot = useCallback(() => {
    const slot = RECOMMENDED_SLOTS[type]
    const startDate = nextRecommendedDate(type, today)
    setSchedule((current) => ({
      ...current,
      weekday: slot.weekday ?? current.weekday,
      time: slot.time,
      startDate: startDate ?? current.startDate,
    }))
  }, [setSchedule, type, today])

  return { onTypeChange, markTouched, applyRecommendedSlot }
}
