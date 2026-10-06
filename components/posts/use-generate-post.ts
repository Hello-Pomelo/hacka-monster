import { useCompletion } from "@ai-sdk/react"
import { toast } from "sonner"

import type { GenerateInput } from "@/lib/ai/schema"

// Génère un post en streaming via /api/generate. Le texte reçu remplace `text`.
// Pour une variante, passer le texte actuel (éventuellement modifié) dans `currentText`.
export function useGeneratePost() {
  const { completion, setCompletion, complete, isLoading, stop } = useCompletion({
    api: "/api/generate",
    onError: (error) => toast.error(error.message),
  })

  async function generate(input: GenerateInput) {
    const previous = completion
    const result = await complete("", { body: input })
    // useCompletion vide le texte au départ : en cas d'échec, on rend le texte d'avant.
    // `undefined` : erreur, déjà affichée par onError. Chaîne vide : aucun texte reçu.
    if (result === "") toast.error("Le modèle n'a renvoyé aucun texte. Réessayez.")
    if (result === undefined || result === "") setCompletion(previous)
  }

  return {
    text: completion,
    setText: setCompletion,
    isGenerating: isLoading,
    generate,
    stop,
  }
}
