import "server-only"

import { createClient } from "@/lib/supabase/server"

import type { AdminRow, Charter, CharterClient, EditorialLine, ImportedPost } from "./types"

// Lectures du paramétrage rédaction, avec la session de l'utilisateur (RLS).

export const LINE_COLUMNS =
  "id, code, name, configured, brand, about, core_values, targets, voice_adjectives, we_are, we_are_not, pillars, target_per_week, defaults, reference_posts, version, updated_at, updated_by"

export const CHARTER_COLUMNS =
  "id, banned_expressions, sensitive_topics, address_form, inclusive_writing, version, updated_at, updated_by"

export const CLIENT_COLUMNS = "id, name, aliases, status, created_at"

const LINE_ORDER = ["marketing", "rh", "neutre"]

export async function getEditorialLines(): Promise<EditorialLine[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("editorial_lines").select(LINE_COLUMNS)
  if (error) throw new Error("Lignes éditoriales illisibles.")
  return data.sort((a, b) => LINE_ORDER.indexOf(a.code) - LINE_ORDER.indexOf(b.code))
}

export async function getEditorialLine(id: string): Promise<EditorialLine | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("editorial_lines")
    .select(LINE_COLUMNS)
    .eq("id", id)
    .maybeSingle()
  if (error) throw new Error("Ligne éditoriale illisible.")
  return data
}

export async function getCharter(): Promise<{ charter: Charter; clients: CharterClient[] }> {
  const supabase = await createClient()
  const [charterResult, clientsResult] = await Promise.all([
    supabase.from("charter").select(CHARTER_COLUMNS).eq("id", 1).single(),
    supabase.from("charter_clients").select(CLIENT_COLUMNS).order("name"),
  ])
  if (charterResult.error) throw new Error("Charte illisible.")
  if (clientsResult.error) throw new Error("Liste des clients illisible.")
  return { charter: charterResult.data, clients: clientsResult.data }
}

// Posts importés de la page LinkedIn, du plus récent au plus ancien (50 au plus, D23).
export async function getImportedPosts(): Promise<ImportedPost[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("posts")
    .select("id, content, published_at, linkedin_url")
    .eq("origin", "linkedin_import")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(50)
  if (error) throw new Error("Posts importés illisibles.")
  return data
}

export async function getAdmins(): Promise<AdminRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nom, role, line_id, line:editorial_lines!profiles_line_id_fkey(name)")
    .order("nom")
  if (error) throw new Error("Liste des admins illisible.")
  return data.map((profile) => ({
    id: profile.id,
    nom: profile.nom,
    role: profile.role,
    lineId: profile.line_id,
    lineName: profile.line?.name ?? null,
  }))
}

// Posts programmés, comptés pour la confirmation de déconnexion (E7).
export async function countScheduledPosts(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "scheduled")
  if (error) throw new Error("Posts programmés illisibles.")
  return count ?? 0
}

export async function getProfileNames(ids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids)]
  if (unique.length === 0) return {}

  const supabase = await createClient()
  const { data, error } = await supabase.from("profiles").select("id, nom").in("id", unique)
  if (error) throw new Error("Noms des admins illisibles.")
  return Object.fromEntries(data.map((profile) => [profile.id, profile.nom]))
}
