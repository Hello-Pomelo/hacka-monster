"use client"

// Sauvegarde automatique de l'éditeur (E3), sans bouton Enregistrer : le texte part 800 ms après la
// dernière frappe, la date et le texte alternatif tout de suite. Les envois partent dans l'ordre,
// un à la fois ; un changement de post ou le démontage envoie ce qui attend encore.

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { savePostDraft } from "@/app/(app)/posts/actions"
import type { EditorPost } from "@/lib/creation"

export type AutosavePatch = { content?: string; scheduledAt?: string | null; imageAlt?: string }

export type AutosaveStatus = "idle" | "saving" | "saved" | "error"

const CONTENT_DELAY_MS = 800
const NETWORK_ERROR = "L'enregistrement a échoué. Réessayez."

type Pending = { postId: string; patch: AutosavePatch }

type AutosaveOptions = {
  // Appelé après un refus : la date affichée revient alors à la valeur enregistrée.
  onError?: (postId: string, patch: AutosavePatch) => void
}

export function useAutosave(
  postId: string,
  onSaved: (post: EditorPost) => void,
  options: AutosaveOptions = {}
): {
  schedule: (patch: AutosavePatch) => void
  // Envoie le changement en attente ; résout à false si le dernier envoi a échoué.
  flush: () => Promise<boolean>
  status: AutosaveStatus
} {
  const [state, setState] = useState<{ postId: string; status: AutosaveStatus }>({
    postId,
    status: "idle",
  })
  const pendingRef = useRef<Pending | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const queueRef = useRef<Promise<boolean>>(Promise.resolve(true))
  const callbacksRef = useRef({ onSaved, onError: options.onError })

  useEffect(() => {
    callbacksRef.current = { onSaved, onError: options.onError }
  })

  const send = useCallback((pending: Pending): Promise<boolean> => {
    const run = async (): Promise<boolean> => {
      setState({ postId: pending.postId, status: "saving" })
      let result: Awaited<ReturnType<typeof savePostDraft>>
      try {
        result = await savePostDraft({ postId: pending.postId, ...pending.patch })
      } catch {
        result = { ok: false, error: NETWORK_ERROR }
      }
      if (result.ok) {
        callbacksRef.current.onSaved(result.data)
        setState({ postId: pending.postId, status: "saved" })
        return true
      }
      toast.error(result.error)
      callbacksRef.current.onError?.(pending.postId, pending.patch)
      setState({ postId: pending.postId, status: "error" })
      return false
    }
    const next = queueRef.current.then(run, run)
    queueRef.current = next
    return next
  }, [])

  const flush = useCallback((): Promise<boolean> => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    const pending = pendingRef.current
    pendingRef.current = null
    return pending ? send(pending) : queueRef.current
  }, [send])

  const schedule = useCallback(
    (patch: AutosavePatch) => {
      if (pendingRef.current && pendingRef.current.postId !== postId) void flush()
      pendingRef.current = { postId, patch: { ...pendingRef.current?.patch, ...patch } }
      setState({ postId, status: "saving" })

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = null
      if (patch.scheduledAt !== undefined || patch.imageAlt !== undefined) {
        void flush()
        return
      }
      timerRef.current = setTimeout(() => void flush(), CONTENT_DELAY_MS)
    },
    [postId, flush]
  )

  // Changement de post courant ou démontage : rien de ce qui a été saisi ne se perd.
  useEffect(() => () => void flush(), [postId, flush])

  return { schedule, flush, status: state.postId === postId ? state.status : "idle" }
}
