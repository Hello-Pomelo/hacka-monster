// Contrôle des garde-fous de la charte (spec Paramétrage, section 5), par du code, sans IA.
// Client non citable et texte trop long : bloquants. Le reste : avertissements.
// Comparaison sur des mots entiers, sans tenir compte de la casse ni des accents.

import { z } from "zod"

import { CREATION_TEXTS, clientNotCitableMessage } from "@/lib/creation"
import { MAX_POST_LENGTH } from "@/lib/posts"
import type { Enums } from "@/lib/supabase/database.types"

export type CharterClient = {
  name: string
  aliases: string[]
  status: Enums<"client_status">
}

export type CharterRules = {
  bannedExpressions: string[]
  sensitiveTopics: string[]
  addressForm: "tu" | "vous"
  clients: CharterClient[]
}

export const EMPTY_CHARTER: CharterRules = {
  bannedExpressions: [],
  sensitiveTopics: [],
  addressForm: "vous",
  clients: [],
}

const GUARDRAIL_KINDS = [
  "client_not_citable",
  "client_without_detail",
  "banned_expression",
  "sensitive_topic",
  "too_long",
  "hashtags",
  "address_form",
  "no_clients",
] as const
export type GuardrailKind = (typeof GUARDRAIL_KINDS)[number]

export type GuardrailItem = {
  kind: GuardrailKind
  severity: "blocking" | "warning"
  message: string
}

export type GuardrailReport = {
  blocking: boolean
  items: GuardrailItem[]
  checkedAt: string
}

const guardrailReportSchema = z.object({
  blocking: z.boolean(),
  items: z.array(
    z.object({
      kind: z.enum(GUARDRAIL_KINDS),
      severity: z.enum(["blocking", "warning"]),
      message: z.string(),
    })
  ),
  checkedAt: z.string(),
})

// Minuscules, sans accents, apostrophes et espaces uniformisés.
export function normalizeForMatch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’ʼ]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/ ([?!:;])/g, "$1")
    .trim()
}

const WORD = "[\\p{L}\\p{N}_]"

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// `normalizedText` est déjà passé par normalizeForMatch.
function containsTerm(normalizedText: string, term: string): boolean {
  const normalizedTerm = normalizeForMatch(term)
  if (!normalizedTerm) return false
  return new RegExp(`(?<!${WORD})${escapeRegExp(normalizedTerm)}(?!${WORD})`, "u").test(normalizedText)
}

const HASHTAG = new RegExp(`(?<![\\p{L}\\p{N}_&])#[\\p{L}\\p{N}_]+`, "gu")
const TU_FORM = new RegExp(`(?<!${WORD})(?:(tu|toi|ton|ta|tes)(?!${WORD})|t'(?=\\p{L}))`, "gu")
// « le ton », « un ton » : le nom, pas le possessif.
const TONE_NOUN_PREFIXES = new Set(["le", "un", "du", "au", "ce", "son", "mon", "notre", "votre", "leur", "meme", "bon"])

function firstTuForm(normalizedText: string): string | null {
  for (const match of normalizedText.matchAll(TU_FORM)) {
    const word = match[0]
    if (word === "ton") {
      const previous = normalizedText.slice(0, match.index).trimEnd().split(" ").pop() ?? ""
      if (TONE_NOUN_PREFIXES.has(previous)) continue
    }
    return word
  }
  return null
}

function clientItems(normalizedText: string, clients: CharterClient[]): GuardrailItem[] {
  return clients.flatMap((client): GuardrailItem[] => {
    if (client.status === "citable") return []
    const cited = [client.name, ...client.aliases].some((term) => containsTerm(normalizedText, term))
    if (!cited) return []
    return client.status === "not_citable"
      ? [{ kind: "client_not_citable", severity: "blocking", message: clientNotCitableMessage(client.name) }]
      : [
          {
            kind: "client_without_detail",
            severity: "warning",
            message: `${client.name} est citable sans détail : vérifiez que le texte ne décrit pas le projet.`,
          },
        ]
  })
}

function postItems(
  text: string,
  normalizedText: string,
  charter: CharterRules,
  hashtagsWanted: boolean | undefined
): GuardrailItem[] {
  const items: GuardrailItem[] = []

  if (text.length > MAX_POST_LENGTH) {
    items.push({ kind: "too_long", severity: "blocking", message: "Le texte dépasse 3 000 caractères." })
  }
  for (const expression of charter.bannedExpressions) {
    if (containsTerm(normalizedText, expression)) {
      items.push({
        kind: "banned_expression",
        severity: "warning",
        message: `Expression interdite par la charte : « ${expression.trim()} ».`,
      })
    }
  }
  for (const topic of charter.sensitiveTopics) {
    if (containsTerm(normalizedText, topic)) {
      items.push({
        kind: "sensitive_topic",
        severity: "warning",
        message: `Sujet sensible : « ${topic.trim()} ». Relisez avec attention.`,
      })
    }
  }

  const hashtagCount = text.match(HASHTAG)?.length ?? 0
  if (hashtagCount > 0 && hashtagsWanted === false) {
    items.push({
      kind: "hashtags",
      severity: "warning",
      message: "Hashtags présents alors que les réglages n'en prévoient pas.",
    })
  } else if (hashtagCount > 3) {
    items.push({
      kind: "hashtags",
      severity: "warning",
      message: `${hashtagCount} hashtags : nous recommandons 3 au plus.`,
    })
  }

  if (charter.addressForm === "vous") {
    const word = firstTuForm(normalizedText)
    if (word) {
      items.push({
        kind: "address_form",
        severity: "warning",
        message: `La charte demande le vouvoiement : « ${word} » détecté.`,
      })
    }
  }

  if (charter.clients.length === 0) {
    items.push({ kind: "no_clients", severity: "warning", message: CREATION_TEXTS.noClients })
  }
  return items
}

// Portée « brief » (sujet, brief et réponses avant génération) : seuls les clients sont vérifiés.
export function checkGuardrails(
  text: string,
  charter: CharterRules,
  options: { scope?: "post" | "brief"; hashtagsWanted?: boolean } = {}
): GuardrailReport {
  const normalizedText = normalizeForMatch(text)
  const items = [
    ...clientItems(normalizedText, charter.clients),
    ...(options.scope === "brief" ? [] : postItems(text, normalizedText, charter, options.hashtagsWanted)),
  ].sort((a, b) => Number(b.severity === "blocking") - Number(a.severity === "blocking"))

  return {
    blocking: items.some((item) => item.severity === "blocking"),
    items,
    checkedAt: new Date().toISOString(),
  }
}

export function firstBlockingMessage(report: GuardrailReport): string | null {
  return report.items.find((item) => item.severity === "blocking")?.message ?? null
}

// Lecture de `posts.guardrail_report` ; null s'il est absent ou illisible.
export function parseGuardrailReport(json: unknown): GuardrailReport | null {
  const parsed = guardrailReportSchema.safeParse(json)
  return parsed.success ? parsed.data : null
}
