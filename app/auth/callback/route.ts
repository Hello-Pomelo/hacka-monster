import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { nextPathSchema } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

const callbackSchema = z.object({
  code: z.string().min(1),
  next: nextPathSchema,
})

// Retour de Google via Supabase : échange le code contre une session (cookies).
// Sans code (consentement refusé, erreur Google), retour sur /login.
export async function GET(request: NextRequest) {
  const loginError = new URL("/login?error=oauth", request.url)
  const parsed = callbackSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) return NextResponse.redirect(loginError)

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(parsed.data.code)
  if (error) return NextResponse.redirect(loginError)

  return NextResponse.redirect(new URL(parsed.data.next, request.url))
}
