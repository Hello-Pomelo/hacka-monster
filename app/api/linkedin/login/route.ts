import { randomUUID } from "node:crypto"

import { NextResponse, type NextRequest } from "next/server"

import { getLinkedInConfig, getRedirectUri, type LinkedInConfig } from "@/lib/linkedin/config"
import { LINKEDIN_STATE_COOKIE, buildAuthorizationUrl, withSearchParam } from "@/lib/linkedin/oauth"
import { nextPathSchema } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

const DEFAULT_NEXT = "/parametrage?onglet=connexion"

// Démarre la connexion de la page LinkedIn. `?next=` indique où revenir pour choisir la page.
// En mode démo, renvoie directement au choix parmi les pages fictives.
export async function GET(request: NextRequest) {
  const { origin, pathname, search, searchParams } = request.nextUrl

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) {
    const login = new URL("/login", origin)
    login.searchParams.set("next", `${pathname}${search}`)
    return NextResponse.redirect(login)
  }

  const rawNext = searchParams.get("next")
  const next = rawNext ? nextPathSchema.parse(rawNext) : DEFAULT_NEXT
  const back = (param: "choose" | "error") =>
    NextResponse.redirect(new URL(withSearchParam(next, "linkedin", param), origin))

  let config: LinkedInConfig | null
  try {
    config = getLinkedInConfig()
  } catch {
    return back("error")
  }
  if (!config) return back("choose")

  const state = randomUUID()
  const response = NextResponse.redirect(
    buildAuthorizationUrl(config, getRedirectUri(origin), state)
  )
  // Le state protège le callback contre une requête forgée (CSRF).
  response.cookies.set(LINKEDIN_STATE_COOKIE, JSON.stringify({ state, next }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/api/linkedin",
  })
  return response
}
