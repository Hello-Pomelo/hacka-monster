"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getSessionUserId } from "@/lib/parametrage/session"
import type { ActionResult } from "@/lib/parametrage/types"
import { createClient } from "@/lib/supabase/server"

// Fin de l'onboarding, par « Passer » à n'importe quelle étape ou par l'activation de la ligne.
// Sans ligne choisie, l'admin est rattaché à la ligne Neutre (D13), puis le calendrier s'ouvre.
export async function finishOnboarding(): Promise<ActionResult> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, error: "Connectez-vous pour continuer." }

  const supabase = await createClient()
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("line_id")
    .eq("id", userId)
    .maybeSingle()
  if (error || !profile) return { ok: false, error: "Votre profil est introuvable." }

  let lineId = profile.line_id
  if (!lineId) {
    const { data: neutral } = await supabase
      .from("editorial_lines")
      .select("id")
      .eq("code", "neutre")
      .maybeSingle()
    lineId = neutral?.id ?? null
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ onboarded_at: new Date().toISOString(), line_id: lineId })
    .eq("id", userId)
  if (updateError) {
    return { ok: false, error: "La configuration n'a pas pu être terminée. Réessayez." }
  }

  revalidatePath("/", "layout")
  redirect("/")
}
