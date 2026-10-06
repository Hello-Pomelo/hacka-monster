import "server-only"

import { createOpenRouter } from "@openrouter/ai-sdk-provider"

// Renvoie null si OpenRouter n'est pas configuré. Lu à l'appel et non au
// chargement du module : les variables ne sont pas toutes disponibles au build.
export function getModel() {
  const apiKey = process.env.OPENROUTER_API_KEY
  const modelId = process.env.OPENROUTER_MODEL
  if (!apiKey || !modelId) return null

  return createOpenRouter({ apiKey })(modelId, {
    // Sans raisonnement : avec Nemotron 3 Super, même l'effort "low" retarde le premier mot de 20 s.
    reasoning: { effort: "none" },
    temperature: 0.6,
  })
}
