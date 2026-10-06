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
  lineId: z.uuid().optional(),
})

const SAVE_ERROR = "Vos paramètres n'ont pas pu être enregistrés."

type Supabase = Awaited<ReturnType<typeof createClient>>

async function getUserId(supabase: Supabase): Promise<string | null> {
  const { data } = await supabase.auth.getClaims()
  return data?.claims.sub ?? null
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

// Choix de la ligne de rattachement depuis le compte : seulement sans ligne ou sur la ligne Neutre
// (onboarding passé). Une fois rattaché à Marketing ou RH, le changement passe par l'écran Admins du
// paramétrage, qui garde au moins un admin par ligne (spec Paramétrage, D15 et US6).
async function lineChangeError(supabase: Supabase, userId: string, lineId: string): Promise<string | null> {
  const [target, current] = await Promise.all([
    supabase.from("editorial_lines").select("code").eq("id", lineId).maybeSingle(),
    supabase.from("profiles").select("line_id, line:editorial_lines(code)").eq("id", userId).single(),
  ])
  if (target.error || current.error) return SAVE_ERROR
  if (!target.data || !ACCOUNT_LINE_CODES.includes(target.data.code)) return "Ligne éditoriale inconnue."

  const { line_id: currentLineId, line: currentLine } = current.data
  if (currentLineId === lineId || currentLineId === null || currentLine?.code === "neutre") return null
  return "Le changement de ligne passe par l'écran Admins du paramétrage."
}

export async function updateAccount(input: { name: string; lineId?: string }): Promise<ActionResult> {
  const parsed = accountSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Paramètres invalides." }

  const supabase = await createClient()
  const userId = await getUserId(supabase)
  if (!userId) return { ok: false, error: "Session expirée. Reconnectez-vous." }

  const { name, lineId } = parsed.data
  if (lineId !== undefined) {
    const lineError = await lineChangeError(supabase, userId, lineId)
    if (lineError) return { ok: false, error: lineError }
  }

  const changes = lineId === undefined ? { nom: name } : { nom: name, line_id: lineId }
  const { error } = await supabase.from("profiles").update(changes).eq("id", userId)
  if (error) return { ok: false, error: SAVE_ERROR }

  revalidatePath("/", "layout")
  return { ok: true, data: null }
}
