import { redirect } from "next/navigation"

import type { Tables } from "./database.types"
import { createClient } from "./server"

export type Profile = Tables<"profiles">

// Profil de l'utilisateur connecté, ou null s'il n'est pas connecté.
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims.sub
  if (!userId) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  return profile
}

// Profil de l'utilisateur connecté ; redirige vers /login sinon.
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login")
  return profile
}

// Profil d'un relecteur ; redirige vers /posts si l'utilisateur n'est pas relecteur.
export async function requireReviewer(): Promise<Profile> {
  const profile = await requireProfile()
  if (profile.role !== "relecteur") redirect("/posts")
  return profile
}
