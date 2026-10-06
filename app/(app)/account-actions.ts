"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import type { ActionResult } from "@/app/(app)/ideas/actions"
import { createClient } from "@/lib/supabase/server"

// Lignes qu'un utilisateur peut choisir comme ligne de rattachement.
const ACCOUNT_LINE_CODES = ["marketing", "rh"]

// `lineId` absent : la ligne reste inchangée (une ligne Neutre, non proposée au choix, est conservée).
const accountSchema = z.object({
  name: z.string().trim().min(1, "Indiquez votre nom.").max(80, "80 caractères au plus."),
  lineId: z.uuid().nullable().optional(),
})

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string | null> {
  const { data } = await supabase.auth.getClaims()
  return data?.claims.sub ?? null
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function updateAccount(input: { name: string; lineId?: string | null }): Promise<ActionResult> {
  const parsed = accountSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Paramètres invalides." }

  const supabase = await createClient()
  const userId = await getUserId(supabase)
  if (!userId) return { ok: false, error: "Session expirée. Reconnectez-vous." }

  const { name, lineId } = parsed.data
  if (lineId) {
    const { data: line, error } = await supabase
      .from("editorial_lines")
      .select("code")
      .eq("id", lineId)
      .maybeSingle()
    if (error || !line || !ACCOUNT_LINE_CODES.includes(line.code)) {
      return { ok: false, error: "Ligne éditoriale inconnue." }
    }
  }

  const changes = lineId === undefined ? { nom: name } : { nom: name, line_id: lineId }
  const { error } = await supabase.from("profiles").update(changes).eq("id", userId)
  if (error) return { ok: false, error: "Vos paramètres n'ont pas pu être enregistrés." }

  revalidatePath("/", "layout")
  return { ok: true, data: null }
}
