// Contrat partagé autour des posts : types, libellés et transitions de statut (spec Création de post),
// lecture des réglages enregistrés en base, URL des images. Utilisable côté serveur et client.

import { z } from "zod"

import { LENGTH_IDS, TONE_IDS, type PostParams } from "@/lib/post-types"
import type { Enums, Tables } from "@/lib/supabase/database.types"

export type { PostParams } from "@/lib/post-types"

export type Post = Tables<"posts">
export type PostStatus = Enums<"post_status">
export type PostOrigin = Enums<"post_origin">

// Limite LinkedIn, doublée par une contrainte sur `posts.content`.
export const MAX_POST_LENGTH = 3000

export const STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Brouillon",
  pending: "En relecture",
  scheduled: "Programmé",
  publishing: "Publication en cours",
  published: "Publié",
  failed: "Échec",
  archived: "Archivé",
}

// Statut affiché : un Brouillon que l'auteur n'a pas encore validé s'affiche « À relire ».
export type DisplayStatus = "to_review" | PostStatus

export const DISPLAY_LABELS: Record<DisplayStatus, string> = {
  to_review: "À relire",
  ...STATUS_LABELS,
}

export function displayStatus(post: Pick<Post, "status" | "validated_at">): DisplayStatus {
  return post.status === "draft" && !post.validated_at ? "to_review" : post.status
}

export const DEFAULT_PARAMS: PostParams = {
  tone: "friendly",
  length: "medium",
  emojis: false,
  hashtags: true,
  cta: "",
}

// Miroir des transitions `actor = 'author'` activées dans `post_transitions`. Le trigger
// `posts_check_update` reste la seule garde : cette table sert à n'afficher que les actions possibles.
export const AUTHOR_TRANSITIONS: Record<PostStatus, readonly PostStatus[]> = {
  draft: ["scheduled", "archived"],
  pending: [],
  scheduled: ["draft", "archived"],
  publishing: [],
  published: ["archived"],
  failed: ["scheduled", "archived"],
  archived: ["draft", "published"],
}

export function canTransition(from: PostStatus, to: PostStatus): boolean {
  return AUTHOR_TRANSITIONS[from].includes(to)
}

// Restaurer un post archivé : Publié s'il a déjà été publié, sinon Brouillon (règle du trigger).
export function restoreStatus(post: Pick<Post, "published_at">): PostStatus {
  return post.published_at ? "published" : "draft"
}

// Statuts que l'auteur peut donner à ce post. Un post importé de LinkedIn n'en a aucun.
export function availableTransitions(
  post: Pick<Post, "status" | "origin" | "published_at">
): PostStatus[] {
  if (post.origin === "linkedin_import") return []
  if (post.status === "archived") return [restoreStatus(post)]
  return [...AUTHOR_TRANSITIONS[post.status]]
}

export function isReadOnly(post: Pick<Post, "status" | "origin">): boolean {
  return (
    post.origin === "linkedin_import" ||
    post.status === "publishing" ||
    post.status === "published" ||
    post.status === "archived"
  )
}

// Titre d'un post dans les listes : l'accroche (première ligne du texte), sinon le sujet.
export function postTitle(post: Pick<Post, "content" | "sujet">, maxLength = 60): string {
  const hook = post.content.trim().split("\n")[0].trim()
  const source = hook || post.sujet.trim()
  if (!source) return "Post sans texte"
  if (source.length <= maxLength) return source

  const cut = source.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > maxLength / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

// Validation stricte des réglages reçus par une Server Action ou un Route Handler.
export const postParamsSchema = z.object({
  tone: z.enum(TONE_IDS),
  length: z.enum(LENGTH_IDS),
  emojis: z.boolean(),
  hashtags: z.boolean(),
  cta: z.string().trim().max(200),
})

// Lecture tolérante d'un JSON en base (`posts.params`, `series.settings`, `editorial_lines.defaults`) :
// chaque champ absent ou invalide prend la valeur de `fallback`.
export function parsePostParams(json: unknown, fallback: PostParams = DEFAULT_PARAMS): PostParams {
  const { shape } = postParamsSchema
  return z
    .object({
      tone: shape.tone.catch(fallback.tone),
      length: shape.length.catch(fallback.length),
      emojis: shape.emojis.catch(fallback.emojis),
      hashtags: shape.hashtags.catch(fallback.hashtags),
      cta: shape.cta.catch(fallback.cta),
    })
    .catch(fallback)
    .parse(json)
}

export const POST_IMAGES_BUCKET = "post-images"
export const POST_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif"] as const
export const MAX_POST_IMAGE_BYTES = 5 * 1024 * 1024

// URL publique d'une image du bucket `post-images` (`posts.image_path`).
export function publicImageUrl(path: string): string {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/")
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${POST_IMAGES_BUCKET}/${encodedPath}`
}
