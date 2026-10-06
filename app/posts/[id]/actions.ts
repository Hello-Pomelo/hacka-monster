"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export type SaveContentResult = { ok: true } | { ok: false; error: string }

// Même plafond que `currentText` dans lib/ai/schema.ts : un texte enregistré peut repartir en variante.
const saveContentSchema = z.object({
  postId: z.uuid(),
  content: z.string().max(5000),
})

// Enregistre le texte du post (F4), généré puis éventuellement modifié par l'auteur.
// Le RLS limite la mise à jour aux posts non publiés de l'auteur, ou à un relecteur.
export async function saveContent(postId: string, content: string): Promise<SaveContentResult> {
  const input = saveContentSchema.safeParse({ postId, content })
  if (!input.success) {
    return { ok: false, error: "Texte invalide : 5 000 caractères au maximum." }
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) {
    return { ok: false, error: "Connectez-vous pour enregistrer le post." }
  }

  const { data, error } = await supabase
    .from("posts")
    .update({ content: input.data.content })
    .eq("id", input.data.postId)
    .select("id")
    .maybeSingle()

  if (error) {
    return { ok: false, error: "L'enregistrement a échoué. Réessayez." }
  }
  // Aucune ligne mise à jour : post inexistant, d'un autre auteur ou déjà publié.
  if (!data) {
    return { ok: false, error: "Ce post n'existe pas ou n'est plus modifiable." }
  }

  revalidatePath(`/posts/${input.data.postId}`)
  revalidatePath("/posts")
  return { ok: true }
}
