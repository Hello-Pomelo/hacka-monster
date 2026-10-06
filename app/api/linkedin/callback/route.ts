import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { LinkedInApiError, listAdministeredPages } from "@/lib/linkedin/api"
import { getLinkedInConfig, getRedirectUri, type LinkedInConfig } from "@/lib/linkedin/config"
import {
  LINKEDIN_PENDING_COOKIE,
  LINKEDIN_STATE_COOKIE,
  exchangeCode,
  mapAuthorizationError,
  sealPendingConnection,
  withSearchParam,
} from "@/lib/linkedin/oauth"
import type { LinkedInPage, LinkedInParam } from "@/lib/linkedin/types"
import { nextPathSchema } from "@/lib/supabase/auth"

const DEFAULT_NEXT = "/parametrage?onglet=connexion"
// Le cookie de connexion en attente doit rester sous 4 Ko : au-delà, le navigateur l'ignore.
const MAX_PAGE_CHOICES = 25

const stateCookieSchema = z.object({ state: z.string(), next: nextPathSchema })

function readStateCookie(raw: string | undefined) {
  if (!raw) return null
  try {
    const parsed = stateCookieSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

// Retour de LinkedIn : vérifie le state, échange le code, liste les pages administrées et les garde
// dans un cookie chiffré jusqu'au choix de la page. Aucun jeton dans l'URL.
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl
  const saved = readStateCookie(request.cookies.get(LINKEDIN_STATE_COOKIE)?.value)
  const next = saved?.next ?? DEFAULT_NEXT

  const back = (param: LinkedInParam, pending?: string) => {
    const response = NextResponse.redirect(new URL(withSearchParam(next, "linkedin", param), origin))
    response.cookies.delete({ name: LINKEDIN_STATE_COOKIE, path: "/api/linkedin" })
    if (pending) {
      response.cookies.set(LINKEDIN_PENDING_COOKIE, pending, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/",
      })
    }
    return response
  }

  if (!saved || searchParams.get("state") !== saved.state) return back("error")

  const authorizationError = searchParams.get("error")
  if (authorizationError) return back(mapAuthorizationError(authorizationError))

  const code = searchParams.get("code")
  if (!code) return back("error")

  let config: LinkedInConfig | null
  try {
    config = getLinkedInConfig()
  } catch {
    return back("error")
  }
  if (!config) return back("error")

  let token: Awaited<ReturnType<typeof exchangeCode>>
  try {
    token = await exchangeCode(config, code, getRedirectUri(origin))
  } catch {
    return back("error")
  }

  let pages: LinkedInPage[]
  try {
    pages = await listAdministeredPages({ token: token.accessToken, apiVersion: config.apiVersion })
  } catch (error) {
    const denied = error instanceof LinkedInApiError && (error.status === 401 || error.status === 403)
    return back(denied ? "api_denied" : "error")
  }
  if (pages.length === 0) return back("no_page")

  try {
    return back("choose", sealPendingConnection({ ...token, pages: pages.slice(0, MAX_PAGE_CHOICES) }))
  } catch {
    return back("error")
  }
}
