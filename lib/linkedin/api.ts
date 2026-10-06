import "server-only"

import { z } from "zod"

import type { LinkedInPage, RemotePost } from "./types"

// Client de l'API REST LinkedIn (Community Management API). Jamais appelé en développement :
// le mode démo le remplace tant que LINKEDIN_CLIENT_ID n'est pas renseigné.
const API_BASE = "https://api.linkedin.com/rest"
const REQUEST_TIMEOUT_MS = 20_000

export type ApiContext = { token: string; apiVersion: string }

export class LinkedInApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = "LinkedInApiError"
  }
}

function apiHeaders(ctx: ApiContext, extra: Record<string, string> = {}): Record<string, string> {
  return {
    Authorization: `Bearer ${ctx.token}`,
    "LinkedIn-Version": ctx.apiVersion,
    "X-Restli-Protocol-Version": "2.0.0",
    ...extra,
  }
}

async function apiFetch(
  ctx: ApiContext,
  path: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {}
): Promise<Response> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: init.method ?? "GET",
    headers: apiHeaders(ctx, init.headers),
    body: init.body,
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new LinkedInApiError(`LinkedIn a répondu ${response.status}.`, response.status)
  }
  return response
}

// Le champ `commentary` suit le format « little text » : les caractères réservés
// non échappés tronquent le post. Les hashtags passent par leur gabarit dédié.
export function toLittleText(text: string): string {
  const escaped = text.replace(/[\\|{}@[\]()<>#*_~]/g, (char) => `\\${char}`)
  return escaped.replace(/\\#([\p{L}\p{N}_]+)/gu, (_, tag: string) => `{hashtag|\\#|${tag}}`)
}

// Inverse de toLittleText, pour les posts importés : gabarits de hashtag et de mention, échappements.
export function fromLittleText(text: string): string {
  return text
    .replace(/\{hashtag\|\\?#\|([^}]+)\}/g, (_, tag: string) => `#${tag}`)
    .replace(/@\[([^\]]*)\]\(urn:li:[^)]+\)/g, (_, name: string) => name)
    .replace(/\\([\s\S])/g, (_, char: string) => char)
}

export function postUrl(urn: string): string {
  return `https://www.linkedin.com/feed/update/${urn}/`
}

const aclsSchema = z.object({
  elements: z.array(z.object({ organization: z.string().optional() })).catch([]),
})

const organizationSchema = z.object({
  localizedName: z.string().optional(),
  name: z.object({ localized: z.record(z.string(), z.string()).optional() }).optional(),
})

// Pages dont le membre connecté est administrateur.
export async function listAdministeredPages(ctx: ApiContext): Promise<LinkedInPage[]> {
  const aclsResponse = await apiFetch(
    ctx,
    "/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&count=100"
  )
  const acls = aclsSchema.parse(await aclsResponse.json())
  const urns = [
    ...new Set(
      acls.elements.flatMap((acl) =>
        acl.organization?.startsWith("urn:li:organization:") ? [acl.organization] : []
      )
    ),
  ]

  return Promise.all(
    urns.map(async (urn) => {
      const id = urn.slice("urn:li:organization:".length)
      const response = await apiFetch(ctx, `/organizations/${encodeURIComponent(id)}`)
      const organization = organizationSchema.catch({}).parse(await response.json())
      const localized = Object.values(organization.name?.localized ?? {})[0]
      return { urn, name: organization.localizedName ?? localized ?? `Page ${id}`, logoUrl: null }
    })
  )
}

const remotePostSchema = z.object({
  id: z.string(),
  commentary: z.string().nullish(),
  publishedAt: z.number().nullish(),
  createdAt: z.number().nullish(),
  lifecycleState: z.string().nullish(),
  content: z
    .object({
      media: z.object({ id: z.string().optional() }).nullish(),
      multiImage: z.unknown().optional(),
    })
    .nullish(),
})

const postsResponseSchema = z.object({ elements: z.array(z.unknown()).catch([]) })

function hasImage(content: z.infer<typeof remotePostSchema>["content"]): boolean {
  if (!content) return false
  if (content.multiImage) return true
  if (!content.media) return false
  return !content.media.id?.startsWith("urn:li:video:")
}

// Derniers posts publiés par la page, du plus récent au plus ancien, depuis `since`.
export async function fetchPagePosts(
  ctx: ApiContext,
  organizationUrn: string,
  options: { max: number; since: Date }
): Promise<RemotePost[]> {
  const query = new URLSearchParams({
    q: "author",
    author: organizationUrn,
    count: String(Math.min(options.max, 100)),
    sortBy: "LAST_MODIFIED",
  })
  const response = await apiFetch(ctx, `/posts?${query}`, {
    headers: { "X-RestLi-Method": "FINDER" },
  })
  const { elements } = postsResponseSchema.parse(await response.json())

  return elements.flatMap((element) => {
    const parsed = remotePostSchema.safeParse(element)
    if (!parsed.success) return []
    const post = parsed.data
    if (post.lifecycleState && post.lifecycleState !== "PUBLISHED") return []

    const publishedMs = post.publishedAt ?? post.createdAt
    if (!publishedMs || publishedMs < options.since.getTime()) return []

    return [
      {
        urn: post.id,
        text: fromLittleText(post.commentary ?? ""),
        publishedAt: new Date(publishedMs).toISOString(),
        hasImage: hasImage(post.content),
        url: postUrl(post.id),
      },
    ]
  })
}

const initializeUploadSchema = z.object({
  value: z.object({ uploadUrl: z.url(), image: z.string() }),
})

// Envoie une image à LinkedIn au nom de la page et renvoie son URN, à référencer dans le post.
export async function uploadImage(
  ctx: ApiContext,
  organizationUrn: string,
  imageUrl: string
): Promise<string> {
  const initResponse = await apiFetch(ctx, "/images?action=initializeUpload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initializeUploadRequest: { owner: organizationUrn } }),
  })
  const { value } = initializeUploadSchema.parse(await initResponse.json())

  const source = await fetch(imageUrl, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  if (!source.ok) {
    throw new LinkedInApiError(`Image introuvable (${source.status}).`, source.status)
  }
  const bytes = await source.arrayBuffer()

  const upload = await fetch(value.uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${ctx.token}` },
    body: bytes,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!upload.ok) {
    throw new LinkedInApiError(`Envoi de l'image refusé (${upload.status}).`, upload.status)
  }
  return value.image
}

// Publie un post sur la page. L'URN du post arrive dans l'en-tête `x-restli-id` (réponse 201).
export async function createPost(
  ctx: ApiContext,
  organizationUrn: string,
  input: { text: string; imageUrn?: string; altText?: string }
): Promise<{ postUrn: string }> {
  const response = await apiFetch(ctx, "/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      author: organizationUrn,
      commentary: toLittleText(input.text),
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
      ...(input.imageUrn
        ? { content: { media: { id: input.imageUrn, altText: input.altText ?? "" } } }
        : {}),
    }),
  })

  const postUrn = response.headers.get("x-restli-id")
  // Erreur simple, pas LinkedInApiError : le post est peut-être publié, l'appelant ne doit pas réessayer.
  if (!postUrn) throw new Error("Identifiant du post absent de la réponse LinkedIn.")
  return { postUrn }
}
