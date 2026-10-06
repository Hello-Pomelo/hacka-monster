"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import type { ActionResult } from "@/lib/parametrage/types"

export type AutosaveState = "idle" | "saving" | "saved" | "error"

// Enregistre `value` 800 ms après la dernière modification (spec Paramétrage, US1). La valeur
// initiale est considérée comme enregistrée. Les enregistrements partent un par un, dans l'ordre.
export function useAutosave<T>(
  value: T,
  save: (value: T) => Promise<ActionResult<unknown>>,
  options: { delayMs?: number; enabled?: boolean } = {}
): { state: AutosaveState; flush: () => Promise<void> } {
  const { delayMs = 800, enabled = true } = options
  const [state, setState] = useState<AutosaveState>("idle")
  const serialized = JSON.stringify(value)

  const lastSaved = useRef(serialized)
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

    const { value: current, serialized: currentSerialized } = latest.current
    if (currentSerialized === lastSaved.current) return

    setState("saving")
    const task = (async () => {
      try {
        const result = await saveRef.current(current)
        if (result.ok) {
          lastSaved.current = currentSerialized
          // Une modification arrivée pendant l'envoi garde l'état « Enregistrement… ».
          if (latest.current.serialized === currentSerialized) setState("saved")
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
    if (!enabled || serialized === lastSaved.current) return
    timer.current = setTimeout(() => void run(), delayMs)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [serialized, enabled, delayMs, run])

  // Au démontage (changement d'étape, de page), la dernière modification part sans attendre.
  useEffect(() => () => void run(), [run])

  const flush = useCallback(() => run(), [run])

  return { state, flush }
}
