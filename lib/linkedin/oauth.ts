import "server-only"

import { cookies } from "next/headers"
import { z } from "zod"

import { LINKEDIN_SCOPES, isLinkedInDemoMode, type LinkedInConfig } from "./config"
import { decryptSecret, encryptSecret } from "./crypto"
import { DEMO_PAGES } from "./demo"
import type { LinkedInErrorCode, LinkedInPage } from "./types"

// Le state protège le callback contre une requête forgée (CSRF).
export const LINKEDIN_STATE_COOKIE = "linkedin_oauth_state"
// Résultat de l'OAuth (jeton, pages administrées) en attendant le choix de la page, chiffré.
export const LINKEDIN_PENDING_COOKIE = "linkedin_pending"

export function buildAuthorizationUrl(
  config: LinkedInConfig,
  redirectUri: string,
  state: string
): string {
  const url = new URL("https://www.linkedin.com/oauth/v2/authorization")
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: redirectUri,
    state,
    scope: LINKEDIN_SCOPES,
  }).toString()
  return url.toString()
}

const tokenSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().positive(),
  scope: z.string().optional(),
})

// Échange le code d'autorisation contre un jeton d'accès.
export async function exchangeCode(
  config: LinkedInConfig,
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; expiresAt: string; scopes: string[] }> {
  const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`Échange du code refusé (${response.status}).`)

  const token = tokenSchema.parse(await response.json())
  return {
    accessToken: token.access_token,
    expiresAt: new Date(Date.now() + token.expires_in * 1000).toISOString(),
    scopes: (token.scope ?? LINKEDIN_SCOPES).split(/[\s,]+/).filter(Boolean),
  }
}

export type PendingConnection = {
  accessToken: string
  expiresAt: string
  scopes: string[]
  pages: LinkedInPage[]
}

const pendingSchema = z.object({
  accessToken: z.string().min(1),
  expiresAt: z.string(),
  scopes: z.array(z.string()),
  pages: z.array(
    z.object({ urn: z.string(), name: z.string(), logoUrl: z.string().nullable() })
  ),
})

export function sealPendingConnection(pending: PendingConnection): string {
  return encryptSecret(JSON.stringify(pending))
}

// Connexion en attente du choix de la page, ou null si le cookie est absent, expiré ou altéré.
export async function readPendingConnection(): Promise<PendingConnection | null> {
  const raw = (await cookies()).get(LINKEDIN_PENDING_COOKIE)?.value
  if (!raw) return null
  try {
    const parsed = pendingSchema.safeParse(JSON.parse(decryptSecret(raw)))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

// Server Action ou Route Handler uniquement : un Server Component ne peut pas écrire de cookie.
export async function clearPendingConnection(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete({ name: LINKEDIN_PENDING_COOKIE, path: "/" })
}

// Pages proposées au choix : pages fictives en mode démo, sinon celles du retour OAuth.
export async function getPageChoices(): Promise<LinkedInPage[] | null> {
  if (isLinkedInDemoMode()) return DEMO_PAGES
  return (await readPendingConnection())?.pages ?? null
}

export function mapAuthorizationError(error: string | null): LinkedInErrorCode {
  switch (error) {
    case "user_cancelled_login":
    case "user_cancelled_authorize":
    case "access_denied":
      return "refused"
    case "unauthorized_scope_error":
      return "api_denied"
    default:
      return "error"
  }
}

// Ajoute ou remplace un paramètre d'URL sur un chemin interne, en gardant les autres.
export function withSearchParam(path: string, key: string, value: string): string {
  const url = new URL(path, "http://localhost")
  url.searchParams.set(key, value)
  return `${url.pathname}${url.search}${url.hash}`
}
