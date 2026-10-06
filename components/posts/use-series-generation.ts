"use client"

// Génération au fil de l'eau d'une série (E3, spec Création de post P0 3) : les Brouillons sans
// texte sont écrits un par un. Un échec n'arrête pas la file : les posts réussis sont conservés et
// le repère en erreur propose une relance.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import type { GenerationResult, PostGeneration } from "@/components/posts/use-post-generation"
import type { EditorPost } from "@/lib/creation"

const GENERATION_FAILED = "La génération a échoué. Réessayez."

export type PostGenerationStatus = "idle" | "queued" | "writing" | "error"

export type SeriesGenerationState = {
  statusById: Record<string, PostGenerationStatus>
  isRunning: boolean
  retry: (postId: string) => void
}

type UseSeriesGenerationOptions = {
  posts: EditorPost[]
  autoStart: boolean
  generation: PostGeneration
  onPostGenerated: (post: EditorPost) => void
}

type QueueStatus = Exclude<PostGenerationStatus, "idle">

// Posts écrits à l'ouverture : Brouillons sans texte, par date de publication, non datés en dernier.
function initialQueue(posts: EditorPost[]): string[] {
  return posts
    .filter((post) => post.status === "draft" && !post.content.trim())
    .map((post, index) => ({
      id: post.id,
      index,
      at: post.scheduled_at ? Date.parse(post.scheduled_at) : Number.POSITIVE_INFINITY,
    }))
    .sort((a, b) => (a.at === b.at ? a.index - b.index : a.at < b.at ? -1 : 1))
    .map((entry) => entry.id)
}

// Un texte saisi par l'auteur pendant l'attente n'est jamais écrasé par la génération.
function canWrite(post: EditorPost | undefined): boolean {
  return Boolean(
    post &&
      post.origin === "app" &&
      (post.status === "draft" || post.status === "failed") &&
      !post.content.trim()
  )
}

export function useSeriesGeneration({
  posts,
  autoStart,
  generation,
  onPostGenerated,
}: UseSeriesGenerationOptions): SeriesGenerationState {
  const [startQueue] = useState(() => (autoStart ? initialQueue(posts) : []))
  const [queueStatus, setQueueStatus] = useState<Record<string, QueueStatus>>(() =>
    Object.fromEntries(startQueue.map((id) => [id, "queued" as const]))
  )

  const queueRef = useRef<string[]>([])
  const currentRef = useRef<string | null>(null)
  const startedRef = useRef(false)
  const mountedRef = useRef(true)
  const postsRef = useRef(posts)
  const generateRef = useRef(generation.generate)
  const onPostGeneratedRef = useRef(onPostGenerated)

  useEffect(() => {
    postsRef.current = posts
    generateRef.current = generation.generate
    onPostGeneratedRef.current = onPostGenerated
  })

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const setStatus = useCallback((postId: string, status: PostGenerationStatus) => {
    setQueueStatus((current) => {
      const { [postId]: previous, ...rest } = current
      if (status === "idle") return previous === undefined ? current : rest
      return previous === status ? current : { ...rest, [postId]: status }
    })
  }, [])

  // Un seul passage actif : chaque post attend la fin du précédent.
  const drain = useCallback(async () => {
    if (currentRef.current !== null) return
    while (mountedRef.current && queueRef.current.length > 0) {
      const postId = queueRef.current.shift()
      if (!postId) break
      if (!canWrite(postsRef.current.find((post) => post.id === postId))) {
        setStatus(postId, "idle")
        continue
      }

      currentRef.current = postId
      setStatus(postId, "writing")
      try {
        const result = await generateRef
          .current({ postId, mode: "generate" })
          .catch((): GenerationResult => ({ ok: false, error: GENERATION_FAILED }))
        if (result.ok) {
          onPostGeneratedRef.current(result.post)
          setStatus(postId, "idle")
        } else {
          setStatus(postId, "error")
          // Même message : un seul toast, mis à jour (quota épuisé sur toute la série, par exemple).
          toast.error(result.error, { id: result.error })
        }
      } finally {
        currentRef.current = null
      }
    }
  }, [setStatus])

  const enqueue = useCallback(
    (postIds: string[]) => {
      const fresh = postIds.filter(
        (postId) => postId !== currentRef.current && !queueRef.current.includes(postId)
      )
      if (fresh.length === 0) return
      queueRef.current.push(...fresh)
      for (const postId of fresh) setStatus(postId, "queued")
      void drain()
    },
    [drain, setStatus]
  )

  // Ref : en Strict Mode, l'effet est rejoué sans que la file reparte une seconde fois.
  useEffect(() => {
    if (startedRef.current || startQueue.length === 0) return
    startedRef.current = true
    enqueue(startQueue)
  }, [enqueue, startQueue])

  const retry = useCallback((postId: string) => enqueue([postId]), [enqueue])

  const { activePostId } = generation
  const statusById = useMemo(() => {
    const result: Record<string, PostGenerationStatus> = {}
    for (const post of posts) {
      const status = queueStatus[post.id]
      if (post.id === activePostId) result[post.id] = "writing"
      else if (status === "queued" || status === "writing") result[post.id] = status
      // Un échec n'est plus signalé dès que le post a un texte (écrit à la main ou régénéré).
      else if (status === "error" && !post.content.trim()) result[post.id] = "error"
      else result[post.id] = "idle"
    }
    return result
  }, [posts, queueStatus, activePostId])

  const isRunning = Object.values(queueStatus).some((status) => status === "queued" || status === "writing")

  return { statusById, isRunning, retry }
}
