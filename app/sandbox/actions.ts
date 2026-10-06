"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export type AuthState = { error?: string; info?: string }

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
})

const INVALID_CREDENTIALS = "E-mail invalide ou mot de passe trop court (6 caractères minimum)."

export async function signIn(_state: AuthState, formData: FormData): Promise<AuthState> {
  const credentials = credentialsSchema.safeParse(Object.fromEntries(formData))
  if (!credentials.success) return { error: INVALID_CREDENTIALS }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(credentials.data)
  if (error) return { error: `Connexion refusée : ${error.message}` }

  redirect("/sandbox")
}

export async function signUp(_state: AuthState, formData: FormData): Promise<AuthState> {
  const credentials = credentialsSchema.safeParse(Object.fromEntries(formData))
  if (!credentials.success) return { error: INVALID_CREDENTIALS }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp(credentials.data)
  if (error) return { error: `Inscription refusée : ${error.message}` }
  // Sans session : le projet Supabase exige la confirmation de l'e-mail.
  if (!data.session) return { info: "Compte créé. Confirmez votre e-mail, puis connectez-vous." }

  redirect("/sandbox")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/sandbox/login")
}
