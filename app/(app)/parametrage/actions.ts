"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { proposeLine, writeTestPost } from "@/lib/parametrage/ai"
import { checkGuardrails, type GuardrailReport } from "@/lib/parametrage/guardrails"
import {
  CLIENT_COLUMNS,
  getCharter,
  getEditorialLine,
  getImportedPosts,
} from "@/lib/parametrage/queries"
import { getSessionUserId } from "@/lib/parametrage/session"
import {
  EDITABLE_LINE_CODES,
  charterFieldsSchema,
  clientInputSchema,
  lineFieldsSchema,
  type ActionResult,
  type CharterClient,
  type CharterFields,
  type ClientInput,
  type EditableLineCode,
  type LineFields,
  type LineProposal,
} from "@/lib/parametrage/types"
import { createClient } from "@/lib/supabase/server"

// Server Actions du paramétrage rédaction (spec Paramétrage, E1 et E2). Le RLS garde les droits :
// une ligne n'est modifiable que par les admins qui y sont rattachés (D15), la charte par tous (D24).

const NOT_SIGNED_IN = "Connectez-vous pour continuer."
const NOT_LINE_ADMIN = "Seuls les admins de cette ligne peuvent la modifier."
const LINE_NOT_FOUND = "Ligne éditoriale introuvable."

const idSchema = z.uuid()

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error }
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

export async function setMyLine(code: EditableLineCode): Promise<ActionResult<{ lineId: string }>> {
  const parsed = z.enum(EDITABLE_LINE_CODES).safeParse(code)
  if (!parsed.success) return fail("Choisissez la ligne Marketing ou RH.")

  const userId = await getSessionUserId()
  if (!userId) return fail(NOT_SIGNED_IN)

  const supabase = await createClient()
  const { data: line, error } = await supabase
    .from("editorial_lines")
    .select("id")
    .eq("code", parsed.data)
    .maybeSingle()
  if (error || !line) return fail(LINE_NOT_FOUND)

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ line_id: line.id })
    .eq("id", userId)
  if (updateError) return fail("Votre ligne n'a pas pu être enregistrée. Réessayez.")

  revalidatePath("/", "layout")
  return { ok: true, data: { lineId: line.id } }
}

// Enregistrement automatique d'une ligne. La version reste la même (v1 seule au hackathon).
export async function saveLine(
  lineId: string,
  patch: Partial<LineFields>
): Promise<ActionResult<{ updatedAt: string }>> {
  const id = idSchema.safeParse(lineId)
  if (!id.success) return fail(LINE_NOT_FOUND)
  const fields = lineFieldsSchema.partial().safeParse(patch)
  if (!fields.success) return fail("Un champ de la ligne est invalide : vérifiez sa longueur.")

  const userId = await getSessionUserId()
  if (!userId) return fail(NOT_SIGNED_IN)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("editorial_lines")
    .update({ ...fields.data, updated_by: userId })
    .eq("id", id.data)
    .select("updated_at")
    .maybeSingle()
  if (error) return fail("La ligne n'a pas pu être enregistrée. Réessayez.")
  if (!data) return fail(NOT_LINE_ADMIN)

  revalidatePath("/parametrage")
  return { ok: true, data: { updatedAt: data.updated_at } }
}

// Proposition de l'IA, sans enregistrement : l'éditeur l'applique puis l'enregistre lui-même.
export async function proposeLineAction(lineId: string): Promise<ActionResult<LineProposal>> {
  const id = idSchema.safeParse(lineId)
  if (!id.success) return fail(LINE_NOT_FOUND)

  const userId = await getSessionUserId()
  if (!userId) return fail(NOT_SIGNED_IN)

  try {
    const line = await getEditorialLine(id.data)
    if (!line) return fail(LINE_NOT_FOUND)

    // Avec un import, l'IA s'appuie sur tous les posts importés (E1, étape 3).
    const imported = (await getImportedPosts()).map((post) => post.content).filter((text) => text.trim())
    const posts = imported.length > 0 ? imported : line.reference_posts
    if (posts.length === 0) {
      return fail("Ajoutez au moins un post de référence ou importez les posts de la page.")
    }

    return { ok: true, data: await proposeLine({ line, posts }) }
  } catch (error) {
    return fail(errorMessage(error, "La proposition a échoué. Réessayez."))
  }
}

// Post de test sur la matière fixe, contrôlé par la charte. Le texte n'est pas enregistré.
export async function generateTestPostAction(
  lineId: string
): Promise<ActionResult<{ text: string; report: GuardrailReport }>> {
  const id = idSchema.safeParse(lineId)
  if (!id.success) return fail(LINE_NOT_FOUND)

  const userId = await getSessionUserId()
  if (!userId) return fail(NOT_SIGNED_IN)

  try {
    const [line, { charter, clients }] = await Promise.all([getEditorialLine(id.data), getCharter()])
    if (!line) return fail(LINE_NOT_FOUND)

    const text = await writeTestPost({ line, charter, clients })
    return { ok: true, data: { text, report: checkGuardrails(text, charter, clients) } }
  } catch (error) {
    return fail(errorMessage(error, "La génération a échoué. Réessayez."))
  }
}

// « Activer la v1 » : la ligne devient active et le bandeau « non configurée » disparaît.
export async function activateLine(lineId: string): Promise<ActionResult> {
  const id = idSchema.safeParse(lineId)
  if (!id.success) return fail(LINE_NOT_FOUND)

  const userId = await getSessionUserId()
  if (!userId) return fail(NOT_SIGNED_IN)

  const supabase = await createClient()
  const { data: line, error } = await supabase
    .from("editorial_lines")
    .select("code, brand")
    .eq("id", id.data)
    .maybeSingle()
  if (error || !line) return fail(LINE_NOT_FOUND)
  if (line.code === "neutre") return fail("La ligne Neutre n'est pas modifiable.")
  if (!line.brand.trim()) return fail("Renseignez le nom de la marque avant d'activer la ligne.")

  const { data, error: updateError } = await supabase
    .from("editorial_lines")
    .update({ configured: true, updated_by: userId })
    .eq("id", id.data)
    .select("id")
    .maybeSingle()
  if (updateError) return fail("La ligne n'a pas pu être activée. Réessayez.")
  if (!data) return fail(NOT_LINE_ADMIN)

  revalidatePath("/", "layout")
  return { ok: true, data: null }
}

export async function saveCharter(
  patch: Partial<CharterFields>
): Promise<ActionResult<{ updatedAt: string }>> {
  const fields = charterFieldsSchema.partial().safeParse(patch)
  if (!fields.success) return fail("Un champ de la charte est invalide : vérifiez sa longueur.")

  const userId = await getSessionUserId()
  if (!userId) return fail(NOT_SIGNED_IN)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("charter")
    .update({ ...fields.data, updated_by: userId })
    .eq("id", 1)
    .select("updated_at")
    .maybeSingle()
  if (error) return fail("La charte n'a pas pu être enregistrée. Réessayez.")
  if (!data) return fail("Charte introuvable.")

  revalidatePath("/parametrage")
  return { ok: true, data: { updatedAt: data.updated_at } }
}

function parseClient(input: ClientInput): { ok: true; data: ClientInput } | { ok: false; error: string } {
  const parsed = clientInputSchema.safeParse(input)
  if (parsed.success) return { ok: true, data: parsed.data }
  const nameIssue = parsed.error.issues.find((issue) => issue.path[0] === "name")
  return fail(nameIssue?.message ?? "Alias ou statut du client invalide.")
}

export async function addClient(input: ClientInput): Promise<ActionResult<{ client: CharterClient }>> {
  const parsed = parseClient(input)
  if (!parsed.ok) return parsed

  const userId = await getSessionUserId()
  if (!userId) return fail(NOT_SIGNED_IN)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("charter_clients")
    .insert(parsed.data)
    .select(CLIENT_COLUMNS)
    .single()
  if (error) return fail("Le client n'a pas pu être ajouté. Réessayez.")

  revalidatePath("/parametrage")
  return { ok: true, data: { client: data } }
}

export async function updateClient(id: string, input: ClientInput): Promise<ActionResult> {
  const clientId = idSchema.safeParse(id)
  if (!clientId.success) return fail("Client introuvable.")
  const parsed = parseClient(input)
  if (!parsed.ok) return parsed

  const userId = await getSessionUserId()
  if (!userId) return fail(NOT_SIGNED_IN)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("charter_clients")
    .update(parsed.data)
    .eq("id", clientId.data)
    .select("id")
    .maybeSingle()
  if (error) return fail("Le client n'a pas pu être modifié. Réessayez.")
  if (!data) return fail("Client introuvable.")

  revalidatePath("/parametrage")
  return { ok: true, data: null }
}

export async function deleteClient(id: string): Promise<ActionResult> {
  const clientId = idSchema.safeParse(id)
  if (!clientId.success) return fail("Client introuvable.")

  const userId = await getSessionUserId()
  if (!userId) return fail(NOT_SIGNED_IN)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("charter_clients")
    .delete()
    .eq("id", clientId.data)
    .select("id")
    .maybeSingle()
  if (error) return fail("Le client n'a pas pu être supprimé. Réessayez.")
  if (!data) return fail("Client introuvable.")

  revalidatePath("/parametrage")
  return { ok: true, data: null }
}
