// Conditions de programmation d'un post (spec Création de post, P0 6) : compte lié, post validé,
// texte non vide, aucun garde-fou bloquant, date future, token valide à la date, image décrite.
// Le serveur refait ce contrôle ; le trigger posts_check_update garde le texte vide et la date passée.

import {
  CREATION_TEXTS,
  type EditorPost,
  type LinkedInConnectionSummary,
} from "@/lib/creation"
import { checkGuardrails, firstBlockingMessage, type CharterRules } from "@/lib/guardrails"

export type ScheduleBlocker = {
  reason:
    | "not_validated"
    | "guardrail"
    | "token_expired"
    | "past_date"
    | "empty_text"
    | "missing_alt"
    | "not_connected"
  message: string
}

type ScheduleContext = {
  charter: CharterRules
  connection: LinkedInConnectionSummary | null
  now: Date
}

// Motifs dans l'ordre d'affichage : le premier est celui montré à l'auteur.
export function scheduleBlockers(
  post: EditorPost,
  ctx: ScheduleContext & { requireValidated: boolean }
): ScheduleBlocker[] {
  const blockers: ScheduleBlocker[] = []

  if (!ctx.connection) {
    blockers.push({ reason: "not_connected", message: CREATION_TEXTS.linkedinMissing })
  }
  if (ctx.requireValidated && !post.validated_at) {
    blockers.push({ reason: "not_validated", message: CREATION_TEXTS.notValidated })
  }
  if (!post.content.trim()) {
    blockers.push({ reason: "empty_text", message: "Texte vide : rédigez le post avant de le programmer." })
  }

  const guardrail = firstBlockingMessage(checkGuardrails(post.content, ctx.charter))
  if (guardrail) blockers.push({ reason: "guardrail", message: guardrail })

  const scheduledAt = post.scheduled_at ? Date.parse(post.scheduled_at) : Number.NaN
  if (!(scheduledAt > ctx.now.getTime())) {
    blockers.push({
      reason: "past_date",
      message: "Date de publication passée ou absente : choisissez une date à venir.",
    })
  } else if (ctx.connection?.expiresAt && Date.parse(ctx.connection.expiresAt) < scheduledAt) {
    blockers.push({ reason: "token_expired", message: CREATION_TEXTS.tokenExpired })
  }

  if (post.image_path && !post.image_alt?.trim()) {
    blockers.push({ reason: "missing_alt", message: "Texte alternatif manquant : décrivez l'image." })
  }
  return blockers
}

function scheduledTime(post: EditorPost): number {
  return post.scheduled_at ? Date.parse(post.scheduled_at) : Number.POSITIVE_INFINITY
}

// Récapitulatif de E5 sur les Brouillons et Échecs de la série, triés par date. L'absence de
// connexion bloque toute la modale : elle n'apparaît pas dans les motifs par post.
export function buildScheduleRecap(
  posts: EditorPost[],
  ctx: ScheduleContext
): {
  eligible: EditorPost[]
  excluded: { post: EditorPost; blockers: ScheduleBlocker[] }[]
  noClients: boolean
} {
  const eligible: EditorPost[] = []
  const excluded: { post: EditorPost; blockers: ScheduleBlocker[] }[] = []

  const candidates = posts
    .filter((post) => post.status === "draft" || post.status === "failed")
    .sort((a, b) => scheduledTime(a) - scheduledTime(b))

  for (const post of candidates) {
    const blockers = scheduleBlockers(post, { ...ctx, requireValidated: true }).filter(
      (blocker) => blocker.reason !== "not_connected"
    )
    if (blockers.length === 0) eligible.push(post)
    else excluded.push({ post, blockers })
  }

  return { eligible, excluded, noClients: ctx.charter.clients.length === 0 }
}
