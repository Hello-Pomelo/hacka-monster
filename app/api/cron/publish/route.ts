import { timingSafeEqual } from "node:crypto"

import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { checkGuardrails, firstBlockingMessage, type CharterRules } from "@/lib/guardrails"
import { publishOnLinkedInPage, type PublishConnection } from "@/lib/linkedin/publish"
import { publicImageUrl } from "@/lib/posts"
import { createClient } from "@/lib/supabase/server"

// Publication à date (spec Création de post, P0 7). Appelée sans session par pg_cron, avec
// « Authorization: Bearer <CRON_SECRET> ». CRON_SECRET doit valoir le secret `cron_secret` du Vault,
// que vérifient les fonctions cron_* (security definer) : aucune clé service_role.
export const dynamic = "force-dynamic"
export const maxDuration = 60

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

function isAuthorized(request: NextRequest, secret: string): boolean {
  const header = request.headers.get("authorization") ?? ""
  const expected = Buffer.from(`Bearer ${secret}`)
  const received = Buffer.from(header)
  return received.length === expected.length && timingSafeEqual(received, expected)
}

async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET n'est pas configuré." }, { status: 500 })
  }
  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: rawContext, error: contextError } = await supabase.rpc("cron_publication_context", {
    p_secret: secret,
  })
  const context = contextSchema.safeParse(rawContext)
  if (contextError || !context.success) {
    return NextResponse.json({ error: "Lecture du contexte de publication impossible." }, { status: 500 })
  }

  // Sans page connectée, les posts restent Programmés jusqu'à la reconnexion (spec Création, E7).
  const connection: PublishConnection | null = context.data.connection
  if (!connection) {
    return NextResponse.json({ claimed: 0, published: 0, failed: 0, skipped: "Aucune page connectée." })
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
  if (claimError) {
    return NextResponse.json({ error: "Récupération des posts à publier impossible." }, { status: 500 })
  }

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

  return NextResponse.json({ claimed: posts?.length ?? 0, published, failed, errors })
}

export const GET = handle
export const POST = handle
