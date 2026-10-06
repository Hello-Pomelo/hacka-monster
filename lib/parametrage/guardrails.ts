// Contrôle de la charte par du code (spec Paramétrage, section 5) : clients et alias, expressions
// interdites, longueur, hashtags. Client non citable = bloquant, le reste = avertissement.
// Utilisable côté serveur et client : appelé par le paramétrage, la création de post et la publication.

import { MAX_POST_LENGTH } from "@/lib/posts"
import type { Tables } from "@/lib/supabase/database.types"

type Charter = Tables<"charter">
type CharterClient = Tables<"charter_clients">

export type GuardrailIssue = {
  kind:
    | "client_not_citable"
    | "client_without_detail"
    | "banned_expression"
    | "too_long"
    | "too_many_hashtags"
    | "no_clients"
  severity: "blocking" | "warning"
  message: string
  match?: string
}

export type GuardrailReport = { blocking: boolean; issues: GuardrailIssue[] }

// Plafond de hashtags par post, à confirmer avec le marketing.
export const MAX_HASHTAGS = 3

const numberFormat = new Intl.NumberFormat("fr-FR")

// Minuscules, sans accents, apostrophes typographiques et espaces unifiés.
export function normalizeForMatch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’‘`´]/g, "'")
    .replace(/\s+/g, " ")
    .toLowerCase()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Recherche d'un terme en mot entier dans un texte déjà normalisé.
function containsTerm(normalizedText: string, term: string): boolean {
  const normalizedTerm = normalizeForMatch(term).trim()
  if (!normalizedTerm) return false
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}])${escapeRegExp(normalizedTerm)}(?=$|[^\\p{L}\\p{N}])`,
    "u"
  )
  return pattern.test(normalizedText)
}

export function checkGuardrails(
  text: string,
  charter: Pick<Charter, "banned_expressions">,
  clients: Pick<CharterClient, "name" | "aliases" | "status">[]
): GuardrailReport {
  const normalized = normalizeForMatch(text)
  const issues: GuardrailIssue[] = []

  for (const client of clients) {
    if (client.status === "citable") continue
    const match = [client.name, ...client.aliases].find((term) => containsTerm(normalized, term))
    if (!match) continue

    issues.push(
      client.status === "not_citable"
        ? {
            kind: "client_not_citable",
            severity: "blocking",
            message: `Ce texte cite un client non citable : ${client.name}. Retirez-le pour continuer.`,
            match,
          }
        : {
            kind: "client_without_detail",
            severity: "warning",
            message: `Client citable sans détail : ${client.name}. Vérifiez qu'aucun détail du projet n'apparaît.`,
            match,
          }
    )
  }

  for (const expression of charter.banned_expressions) {
    if (!containsTerm(normalized, expression)) continue
    issues.push({
      kind: "banned_expression",
      severity: "warning",
      message: `Expression interdite par la charte : « ${expression} ».`,
      match: expression,
    })
  }

  if (text.length > MAX_POST_LENGTH) {
    issues.push({
      kind: "too_long",
      severity: "warning",
      message: `Texte trop long : ${numberFormat.format(text.length)} caractères pour ${numberFormat.format(MAX_POST_LENGTH)} au plus.`,
    })
  }

  const hashtags = text.match(/#[\p{L}\p{N}_]+/gu)?.length ?? 0
  if (hashtags > MAX_HASHTAGS) {
    issues.push({
      kind: "too_many_hashtags",
      severity: "warning",
      message: `Trop de hashtags : ${hashtags} pour ${MAX_HASHTAGS} au plus.`,
    })
  }

  if (clients.length === 0) {
    issues.push({
      kind: "no_clients",
      severity: "warning",
      message: "Aucun client déclaré dans la charte : les noms de clients ne sont pas vérifiés.",
    })
  }

  // Bloquants en tête : la checklist les affiche en premier.
  issues.sort((a, b) => Number(b.severity === "blocking") - Number(a.severity === "blocking"))
  return { blocking: issues.some((issue) => issue.severity === "blocking"), issues }
}
