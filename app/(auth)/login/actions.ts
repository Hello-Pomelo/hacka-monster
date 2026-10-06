"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { GOOGLE_SCOPES, nextPathSchema } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

// Démarre la connexion Google. Le scope Calendar est demandé dès le login,
// et access_type=offline + prompt=consent garantissent un refresh token.
export async function signInWithGoogle(formData: FormData) {
  const next = nextPathSchema.parse(formData.get("next"))
  const requestHeaders = await headers()
  const origin = requestHeaders.get("origin") ?? `https://${requestHeaders.get("host")}`

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      scopes: GOOGLE_SCOPES,
      queryParams: { access_type: "offline", prompt: "consent", hd: "hello-pomelo.com" },
    },
  })

  if (error || !data.url) redirect("/login?error=oauth")
  redirect(data.url)
}
