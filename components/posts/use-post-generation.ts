"use client"

// Seul fichier qui connaît le corps de POST /api/generate. Interface cible de la piste B :
// { postId, mode, currentText? }, la route lit le post, la série, la ligne et la charte en base,
// puis enregistre le texte. Tant que la route attend l'ancien corps (lib/ai/schema.ts), le texte
// est envoyé avec USE_LEGACY_BODY ; passer la constante à false suffit quand la piste B est livrée.

import { useCompletion } from "@ai-sdk/react"
import { useCallback, useEffect, useRef, useState } from "react"

import { saveGeneratedContent } from "@/app/(app)/posts/actions"
import type { GenerateInput } from "@/lib/ai/schema"
import { parseAnswers, type EditorPost, type SeriesSummary } from "@/lib/creation"
import { POST_TYPES, isPostTypeId } from "@/lib/post-types"
import { parsePostParams } from "@/lib/posts"

const USE_LEGACY_BODY = true

export type GenerateMode = "generate" | "variant"

export type GenerationRequest = {
  postId: string
  mode: GenerateMode
  currentText?: string
}

export type GenerationContext = {
  post: EditorPost
  series: SeriesSummary | null
}

export type GenerationResult = { ok: true; post: EditorPost } | { ok: false; error: string }

export type PostGeneration = {
  // Post en cours d'écriture ; `text` est son texte reçu au fil de l'eau.
  activePostId: string | null
  text: string
  isGenerating: boolean
  generate: (request: GenerationRequest) => Promise<GenerationResult>
  stop: () => void
}

// Ancien corps : le sujet et le brief de la série passent en tête de la première question guidée,
// seules réponses que lit le prompt actuel.
function legacyBody(context: GenerationContext, request: GenerationRequest): GenerateInput | null {
  const { post, series } = context
  if (!isPostTypeId(post.type)) return null

  const answers = parseAnswers(post.answers)
  const firstQuestion = POST_TYPES[post.type].questions[0]
  if (firstQuestion) {
    const subject = series?.subject ?? post.sujet
    const matter = [
      subject && `Sujet : ${subject}`,
      series?.brief && `Brief : ${series.brief}`,
      answers[firstQuestion.id],
    ]
      .filter(Boolean)
      .join("\n")
    answers[firstQuestion.id] = matter.slice(0, 2000)
  }

  return {
    type: post.type,
    cible: "entreprise",
    answers,
    params: parsePostParams(post.params),
    currentText: request.mode === "variant" ? request.currentText?.slice(0, 5000) : undefined,
  }
}

export function usePostGeneration(
  getContext: (postId: string) => GenerationContext | undefined
): PostGeneration {
  const errorRef = useRef<string | null>(null)
  const runningRef = useRef(false)
  const getContextRef = useRef(getContext)
  const [activePostId, setActivePostId] = useState<string | null>(null)

  useEffect(() => {
    getContextRef.current = getContext
  }, [getContext])

  // Stable : `complete` en dépend.
  const onError = useCallback((error: Error) => {
    errorRef.current = error.message
  }, [])

  const { completion, complete, setCompletion, isLoading, stop } = useCompletion({
    api: "/api/generate",
    onError,
  })

  const generate = useCallback(
    async (request: GenerationRequest): Promise<GenerationResult> => {
      if (runningRef.current) return { ok: false, error: "Une génération est déjà en cours." }
      const context = getContextRef.current(request.postId)
      if (!context) return { ok: false, error: "Post introuvable." }

      const body = USE_LEGACY_BODY
        ? legacyBody(context, request)
        : { postId: request.postId, mode: request.mode, currentText: request.currentText }
      if (!body) return { ok: false, error: "Type de post inconnu : impossible de le générer." }

      runningRef.current = true
      errorRef.current = null
      setCompletion("")
      setActivePostId(request.postId)
      try {
        const text = await complete("", { body })
        if (text === null) return { ok: false, error: "Génération interrompue." }
        if (text === undefined) {
          return { ok: false, error: errorRef.current ?? "La génération a échoué. Réessayez." }
        }
        if (!text.trim()) return { ok: false, error: "Le modèle n'a renvoyé aucun texte. Réessayez." }

        // Sans effet visible une fois que la route enregistre elle-même le texte.
        const saved = await saveGeneratedContent(request.postId, text)
        return saved.ok ? { ok: true, post: saved.data } : { ok: false, error: saved.error }
      } catch {
        return { ok: false, error: "La génération a échoué. Réessayez." }
      } finally {
        runningRef.current = false
        setActivePostId(null)
      }
    },
    [complete, setCompletion]
  )

  return { activePostId, text: completion, isGenerating: isLoading, generate, stop }
}
