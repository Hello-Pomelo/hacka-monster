import {
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessageChunk,
} from "ai"

import { toUserMessage } from "@/lib/ai/errors"
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/prompts"
import { getModel } from "@/lib/ai/provider"
import { generateInputSchema } from "@/lib/ai/schema"
import { createClient } from "@/lib/supabase/server"

// Génération d'un post (F3) ou d'une variante (F4), en streaming.
// Consommé par useGeneratePost (components/posts/use-generate-post.ts).
// Les erreurs avant le flux sont renvoyées en texte brut : useCompletion en fait le message d'erreur.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) {
    return new Response("Connectez-vous pour générer un post.", { status: 401 })
  }

  const input = generateInputSchema.safeParse(await request.json().catch(() => null))
  if (!input.success) {
    return new Response("Paramètres du post invalides.", { status: 400 })
  }

  const model = getModel()
  if (!model) {
    return new Response("OpenRouter n'est pas configuré sur le serveur.", { status: 500 })
  }

  const { data: editorialLine } = await supabase
    .from("editorial_line")
    .select("ton, valeurs, mots_a_eviter, exemples")
    .maybeSingle()
  if (!editorialLine) {
    return new Response("Ligne éditoriale introuvable.", { status: 500 })
  }

  const result = streamText({
    model,
    instructions: buildSystemPrompt(editorialLine),
    prompt: buildUserPrompt(input.data),
    timeout: { totalMs: 60_000 },
    abortSignal: request.signal,
  })

  const stream = toUIMessageStream({ stream: result.stream, onError: toUserMessage }).pipeThrough(
    // Un délai dépassé produit un `abort`, que useCompletion ignore : on le change en erreur.
    new TransformStream<UIMessageChunk, UIMessageChunk>({
      transform(chunk, controller) {
        controller.enqueue(
          chunk.type === "abort"
            ? { type: "error", errorText: "Le modèle a mis trop de temps à répondre. Réessayez." }
            : chunk
        )
      },
    })
  )

  return createUIMessageStreamResponse({ stream })
}
