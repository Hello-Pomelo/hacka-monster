import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import type { Database } from "./database.types"

// Pages réservées aux utilisateurs connectés.
const PROTECTED_PATHS = ["/posts", "/review", "/stats"]

// Rafraîchit la session Supabase à chaque requête et redirige vers /login
// les visiteurs non connectés qui demandent une page protégée.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
        },
      },
    }
  )

  // Ne rien exécuter entre createServerClient et getClaims : c'est cet appel
  // qui valide le jeton et le rafraîchit si besoin.
  const { data } = await supabase.auth.getClaims()

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path))

  if (!data?.claims && isProtected) {
    // Retour après connexion avec les paramètres de l'URL (filtres d'un lien partagé).
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    url.searchParams.set("next", `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(url)
  }

  return response
}
