import "server-only"

import { randomUUID } from "node:crypto"

import { LinkedInApiError, createPost, postUrl, uploadImage, type ApiContext } from "./api"
import { getApiVersion } from "./config"
import { decryptSecret } from "./crypto"

// Publication d'un post sur la page connectée, pour la route /api/cron/publish (spec Création de post,
// P0 7 et 9). La connexion vient de `cron_publication_context`, seule lectrice du jeton chiffré.

// Forme de `to_jsonb(linkedin_connection)` renvoyée par `cron_publication_context`.
export type PublishConnection = {
  mode: string
  target_urn: string
  access_token_encrypted: string | null
  expires_at: string | null
}

export type PublishInput = { text: string; image?: { url: string; alt: string } | null }

export type PublishFailureReason =
  | "token_expired"
  | "image_rejected"
  | "content_rejected"
  | "linkedin_error"

export type PublishOutcome =
  | { ok: true; postUrn: string; url: string | null }
  | { ok: false; reason: PublishFailureReason; message: string }

const FAILURE_MESSAGES: Record<PublishFailureReason, string> = {
  token_expired: "La connexion à LinkedIn a expiré. Reconnectez la page.",
  image_rejected: "LinkedIn a refusé l'image. Remplacez-la puis reprogrammez le post.",
  content_rejected: "LinkedIn a refusé le contenu du post.",
  linkedin_error: "Erreur LinkedIn. Réessayez plus tard.",
}

// Réponse perdue après l'envoi (réseau, délai, identifiant absent) : le post est peut-être en ligne.
const UNCERTAIN_MESSAGE =
  "Nous ne savons pas si ce post a été publié. Vérifiez sur LinkedIn avant de le reprogrammer."

function failure(reason: PublishFailureReason, message = FAILURE_MESSAGES[reason]): PublishOutcome {
  return { ok: false, reason, message }
}

export async function publishOnLinkedInPage(
  connection: PublishConnection,
  input: PublishInput
): Promise<PublishOutcome> {
  if (connection.mode === "demo") {
    return { ok: true, postUrn: `urn:li:share:demo-${randomUUID()}`, url: null }
  }

  const expired = connection.expires_at !== null && new Date(connection.expires_at) <= new Date()
  if (!connection.access_token_encrypted || expired) return failure("token_expired")

  let ctx: ApiContext
  try {
    ctx = { token: decryptSecret(connection.access_token_encrypted), apiVersion: getApiVersion() }
  } catch {
    return failure("token_expired")
  }

  let imageUrn: string | undefined
  if (input.image) {
    try {
      imageUrn = await uploadImage(ctx, connection.target_urn, input.image.url)
    } catch (error) {
      if (error instanceof LinkedInApiError && error.status === 401) return failure("token_expired")
      return failure("image_rejected")
    }
  }

  try {
    const { postUrn } = await createPost(ctx, connection.target_urn, {
      text: input.text,
      imageUrn,
      altText: input.image?.alt,
    })
    return { ok: true, postUrn, url: postUrl(postUrn) }
  } catch (error) {
    if (!(error instanceof LinkedInApiError)) return failure("linkedin_error", UNCERTAIN_MESSAGE)
    if (error.status === 401) return failure("token_expired")
    if (error.status === 400 || error.status === 422) return failure("content_rejected")
    return failure("linkedin_error")
  }
}
