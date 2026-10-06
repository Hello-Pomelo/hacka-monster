"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string }

const ideaTextSchema = z.string().trim().min(1, "Notez votre idée.").max(500, "500 caractères au plus.")
const ideaIdSchema = z.uuid()
const suggestionKeySchema = z.string().trim().min(1).max(200)

export async function addIdea(text: string): Promise<ActionResult> {
  const parsed = ideaTextSchema.safeParse(text)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Idée invalide." }

  const supabase = await createClient()
  const { error } = await supabase.from("ideas").insert({ text: parsed.data })
  if (error) return { ok: false, error: "L'idée n'a pas pu être enregistrée." }

  revalidatePath("/")
  return { ok: true, data: null }
}

export async function deleteIdea(id: string): Promise<ActionResult> {
  const parsed = ideaIdSchema.safeParse(id)
  if (!parsed.success) return { ok: false, error: "Idée introuvable." }

  const supabase = await createClient()
  const { error } = await supabase.from("ideas").delete().eq("id", parsed.data)
  if (error) return { ok: false, error: "L'idée n'a pas pu être supprimée." }

  revalidatePath("/")
  return { ok: true, data: null }
}

export async function dismissSuggestion(key: string): Promise<ActionResult> {
  const parsed = suggestionKeySchema.safeParse(key)
  if (!parsed.success) return { ok: false, error: "Suggestion introuvable." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("dismissed_suggestions")
    .upsert({ suggestion_key: parsed.data }, { onConflict: "suggestion_key", ignoreDuplicates: true })
  if (error) return { ok: false, error: "La suggestion n'a pas pu être ignorée." }

  revalidatePath("/")
  return { ok: true, data: null }
}

export async function restoreSuggestion(key: string): Promise<ActionResult> {
  const parsed = suggestionKeySchema.safeParse(key)
  if (!parsed.success) return { ok: false, error: "Suggestion introuvable." }

  const supabase = await createClient()
  const { error } = await supabase.from("dismissed_suggestions").delete().eq("suggestion_key", parsed.data)
  if (error) return { ok: false, error: "La suggestion n'a pas pu être rétablie." }

  revalidatePath("/")
  return { ok: true, data: null }
}
