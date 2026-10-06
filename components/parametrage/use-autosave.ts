"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import type { ActionResult } from "@/lib/parametrage/types"

export type AutosaveState = "idle" | "saving" | "saved" | "error"

// Champs de `next` qui diffèrent de `previous`. Un enregistrement qui n'envoie que ces champs
// n'écrase pas ce qu'un autre admin a modifié entre-temps sur les autres champs.
export function changedFields<T extends Record<string, unknown>>(previous: T, next: T): Partial<T> {
  const patch: Partial<T> = {}
  for (const key of Object.keys(next) as (keyof T)[]) {
    if (JSON.stringify(next[key]) !== JSON.stringify(previous[key])) patch[key] = next[key]
  }
  return patch
}

// Enregistre `value` 800 ms après la dernière modification (spec Paramétrage, US1). La valeur
// initiale est considérée comme enregistrée. Les enregistrements partent un par un, dans l'ordre ;
// `save` reçoit aussi la dernière valeur enregistrée.
export function useAutosave<T>(
  value: T,
  save: (value: T, previous: T) => Promise<ActionResult<unknown>>,
  options: { delayMs?: number; enabled?: boolean } = {}
): { state: AutosaveState; flush: (value?: T) => Promise<void> } {
  const { delayMs = 800, enabled = true } = options
  const [state, setState] = useState<AutosaveState>("idle")
  const serialized = JSON.stringify(value)

  const lastSaved = useRef({ value, serialized })
  const latest = useRef({ value, serialized })
  const saveRef = useRef(save)
  const enabledRef = useRef(enabled)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlight = useRef<Promise<void> | null>(null)

  useEffect(() => {
    latest.current = { value, serialized }
    saveRef.current = save
    enabledRef.current = enabled
  })

  const run = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    while (inFlight.current) await inFlight.current
    if (!enabledRef.current) return

    const current = latest.current
    if (current.serialized === lastSaved.current.serialized) return

    setState("saving")
    const task = (async () => {
      try {
        const result = await saveRef.current(current.value, lastSaved.current.value)
        if (result.ok) {
          lastSaved.current = current
          // Une modification arrivée pendant l'envoi garde l'état « Enregistrement… ».
          if (latest.current.serialized === current.serialized) setState("saved")
        } else {
          setState("error")
          toast.error(result.error)
        }
      } catch {
        setState("error")
        toast.error("Enregistrement impossible. Vérifiez votre connexion puis réessayez.")
      }
    })()

    inFlight.current = task
    try {
      await task
    } finally {
      inFlight.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled || serialized === lastSaved.current.serialized) return
    timer.current = setTimeout(() => void run(), delayMs)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [serialized, enabled, delayMs, run])

  // Au démontage (changement d'étape, de page), la dernière modification part sans attendre.
  useEffect(() => () => void run(), [run])

  // `next` : valeur posée dans le même gestionnaire d'événement, pas encore rendue.
  const flush = useCallback(
    (next?: T) => {
      if (next !== undefined) latest.current = { value: next, serialized: JSON.stringify(next) }
      return run()
    },
    [run]
  )

  return { state, flush }
}
