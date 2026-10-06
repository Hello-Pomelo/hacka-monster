import "server-only"

import { z } from "zod"

import { checkGuardrails, firstBlockingMessage, type CharterRules } from "@/lib/guardrails"
import { publicImageUrl } from "@/lib/posts"
import { createClient } from "@/lib/supabase/server"

import { publishOnLinkedInPage, type PublishConnection } from "./publish"

// Publication des posts arrivés à date (spec Création de post, P0 7), partagée par la route
// /api/cron/publish et l'action « Publier maintenant ». Les fonctions cron_* (security definer)
// vérifient CRON_SECRET contre le secret `cron_secret` du Vault : aucune clé service_role.

const BATCH_SIZE = 10

const contextSchema = z.object({
  connection: z
    .object({
      mode: z.string(),
      target_urn: z.string(),
      access_token_encrypted: z.string().nullable(),
      expires_at: z.string().nullable(),
    })
    .nullable(),
  charter: z
    .object({
      banned_expressions: z.array(z.string()),
      sensitive_topics: z.array(z.string()),
      address_form: z.string(),
    })
    .nullable(),
  clients: z.array(
    z.object({
      name: z.string(),
      aliases: z.array(z.string()),
      status: z.enum(["citable", "citable_without_detail", "not_citable"]),
    })
  ),
})

export type PublishDueResult =
  | { ok: true; claimed: number; published: number; failed: number; errors: string[]; skipped?: string }
  | { ok: false; error: string }

export async function publishDuePosts(secret: string): Promise<PublishDueResult> {
  const supabase = await createClient()

  const { data: rawContext, error: contextError } = await supabase.rpc("cron_publication_context", {
    p_secret: secret,
  })
  const context = contextSchema.safeParse(rawContext)
  if (contextError || !context.success) {
    return { ok: false, error: "Lecture du contexte de publication impossible." }
  }

  // Sans page connectée, les posts restent Programmés jusqu'à la reconnexion (spec Création, E7).
  const connection: PublishConnection | null = context.data.connection
  if (!connection) {
    return { ok: true, claimed: 0, published: 0, failed: 0, errors: [], skipped: "Aucune page connectée." }
  }

  const { charter, clients } = context.data
  const rules: CharterRules = {
    bannedExpressions: charter?.banned_expressions ?? [],
    sensitiveTopics: charter?.sensitive_topics ?? [],
    addressForm: charter?.address_form === "tu" ? "tu" : "vous",
    clients,
  }

  const { data: posts, error: claimError } = await supabase.rpc("cron_claim_due_posts", {
    p_secret: secret,
    p_limit: BATCH_SIZE,
  })
  if (claimError) return { ok: false, error: "Récupération des posts à publier impossible." }

  let published = 0
  let failed = 0
  const errors: string[] = []

  // Un post à la fois : LinkedIn limite le débit, et un échec ne bloque pas les suivants.
  for (const post of posts ?? []) {
    // Contrôle des garde-fous à la publication (D11) : la charte a pu changer depuis la programmation.
    const blocking = firstBlockingMessage(checkGuardrails(post.content, rules))
    const outcome = blocking
      ? { ok: false as const, message: blocking }
      : await publishOnLinkedInPage(connection, {
          text: post.content,
          image: post.image_path
            ? { url: publicImageUrl(post.image_path), alt: post.image_alt ?? "" }
            : null,
        })

    const { error } = await supabase.rpc("cron_complete_post", {
      p_secret: secret,
      p_post_id: post.id,
      p_success: outcome.ok,
      ...(outcome.ok
        ? { p_linkedin_post_urn: outcome.postUrn, p_linkedin_url: outcome.url ?? undefined }
        : { p_failure_reason: outcome.message }),
    })
    if (error) errors.push(`${post.id} : statut non mis à jour.`)
    if (outcome.ok) published++
    else failed++
  }

  return { ok: true, claimed: posts?.length ?? 0, published, failed, errors }
}
