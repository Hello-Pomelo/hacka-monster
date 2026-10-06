import "server-only"

import { generateText } from "ai"

import { toUserMessage } from "@/lib/ai/errors"
import {
  LINE_PROPOSAL_INSTRUCTIONS,
  buildLineProposalPrompt,
  buildLineTestPrompts,
} from "@/lib/ai/prompts"
import { getModel } from "@/lib/ai/provider"
import { DEFAULT_PARAMS, parsePostParams } from "@/lib/posts"

import { TEST_MATERIAL } from "./presets"
import {
  DEFAULT_TARGET_PER_WEEK,
  MAX_VOICE_ADJECTIVES,
  TARGET_FREQUENCY_OPTIONS,
  lineProposalSchema,
  type Charter,
  type CharterClient,
  type EditorialLine,
  type LineProposal,
} from "./types"

// Appels au modèle du paramétrage : proposition de ligne (E1, étape 3) et post de test (E1, étape 5).
// Aucun post n'existe encore : ces appels ne passent pas par /api/generate.

const TIMEOUT_MS = 60_000

function getModelOrThrow() {
  const model = getModel()
  if (!model) throw new Error("OpenRouter n'est pas configuré sur le serveur.")
  return model
}

function toModelError(error: unknown): Error {
  if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
    return new Error("Le modèle a mis trop de temps à répondre. Réessayez.")
  }
  return new Error(toUserMessage(error))
}

// Premier objet JSON complet du texte, même entouré de prose ou d'un bloc de code.
function extractJsonObject(text: string): unknown {
  const start = text.indexOf("{")
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i++) {
    const char = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (char === "\\") escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') inString = true
    else if (char === "{") depth++
    else if (char === "}" && --depth === 0) {
      try {
        return JSON.parse(text.slice(start, i + 1))
      } catch {
        return null
      }
    }
  }
  return null
}

function cleanList(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return []
  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
  return [...new Set(items)].slice(0, maxItems)
}

// Ramène le rythme proposé à l'option la plus proche du sélecteur.
function closestFrequency(value: unknown): number {
  const target = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(target) || target <= 0) return DEFAULT_TARGET_PER_WEEK
  return TARGET_FREQUENCY_OPTIONS.reduce<number>(
    (best, option) => (Math.abs(option.value - target) < Math.abs(best - target) ? option.value : best),
    DEFAULT_TARGET_PER_WEEK
  )
}

// Lecture tolérante : chaque champ absent ou invalide prend une valeur vide ou par défaut.
function toProposal(json: unknown): LineProposal {
  const raw = json !== null && typeof json === "object" ? (json as Record<string, unknown>) : {}
  return lineProposalSchema.parse({
    voice_adjectives: cleanList(raw.voice_adjectives, MAX_VOICE_ADJECTIVES, 40),
    we_are: cleanList(raw.we_are, 6, 120),
    we_are_not: cleanList(raw.we_are_not, 6, 120),
    pillars: cleanList(raw.pillars, 6, 80),
    target_per_week: closestFrequency(raw.target_per_week),
    defaults: parsePostParams(raw.defaults, DEFAULT_PARAMS),
  })
}

export async function proposeLine(input: { line: EditorialLine; posts: string[] }): Promise<LineProposal> {
  const model = getModelOrThrow()
  const prompt = buildLineProposalPrompt({
    brand: input.line.brand,
    about: input.line.about,
    coreValues: input.line.core_values,
    targets: input.line.targets,
    posts: input.posts,
  })

  let text: string
  try {
    ;({ text } = await generateText({
      model,
      instructions: LINE_PROPOSAL_INSTRUCTIONS,
      prompt,
      timeout: { totalMs: TIMEOUT_MS },
    }))
  } catch (error) {
    throw toModelError(error)
  }

  const json = extractJsonObject(text)
  if (json === null) throw new Error("La proposition de l'IA est illisible. Proposez à nouveau.")
  return toProposal(json)
}

// À remplacer par l'assemblage de prompt de la piste Génération une fois fusionnée.
export async function writeTestPost(input: {
  line: EditorialLine
  charter: Charter
  clients: CharterClient[]
}): Promise<string> {
  const model = getModelOrThrow()
  const { instructions, prompt } = buildLineTestPrompts({
    line: { ...input.line, defaults: parsePostParams(input.line.defaults, DEFAULT_PARAMS) },
    charter: input.charter,
    clients: input.clients,
    type: TEST_MATERIAL.type,
    answers: TEST_MATERIAL.answers,
  })

  let text: string
  try {
    ;({ text } = await generateText({ model, instructions, prompt, timeout: { totalMs: TIMEOUT_MS } }))
  } catch (error) {
    throw toModelError(error)
  }

  const post = text.trim()
  if (!post) throw new Error("Le modèle n'a renvoyé aucun texte. Réessayez.")
  return post
}
