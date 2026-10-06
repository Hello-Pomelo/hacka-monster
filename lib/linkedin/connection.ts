import "server-only"

import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

import { decryptSecret, encryptSecret } from "./crypto"
import type { LinkedInConnectionView, LinkedInPage } from "./types"

// Connexion unique à la page (ligne id = 1 de `linkedin_connection`). Colonnes listées une à une :
// `access_token_encrypted` n'est pas lisible depuis l'API (droit de colonne).
const CONNECTION_COLUMNS =
  "mode, target_urn, target_name, target_logo_url, admin_user_id, expires_at, scopes, last_import_at, connected_at, admin:profiles!linkedin_connection_admin_user_id_fkey(nom)"

const CONNECTION_ID = 1

export async function getLinkedInConnection(): Promise<LinkedInConnectionView | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("linkedin_connection")
    .select(CONNECTION_COLUMNS)
    .eq("id", CONNECTION_ID)
    .maybeSingle()

  if (error) throw new Error("Connexion LinkedIn illisible.")
  if (!data) return null

  return {
    mode: data.mode === "demo" ? "demo" : "linkedin",
    targetUrn: data.target_urn,
    targetName: data.target_name,
    targetLogoUrl: data.target_logo_url,
    adminUserId: data.admin_user_id,
    adminName: data.admin?.nom || null,
    expiresAt: data.expires_at,
    scopes: data.scopes,
    lastImportAt: data.last_import_at,
    connectedAt: data.connected_at,
  }
}

// Pas d'upsert : ON CONFLICT DO UPDATE demande des droits de lecture sur toutes les colonnes,
// que `authenticated` n'a pas sur le jeton chiffré.
export async function saveConnection(input: {
  mode: "linkedin" | "demo"
  page: LinkedInPage
  accessToken: string | null
  expiresAt: string | null
  scopes: string[]
  adminUserId: string
}): Promise<void> {
  const supabase = await createClient()
  const { data: existing, error: readError } = await supabase
    .from("linkedin_connection")
    .select("target_urn")
    .eq("id", CONNECTION_ID)
    .maybeSingle()
  if (readError) throw new Error("Connexion LinkedIn illisible.")

  const values = {
    mode: input.mode,
    target_urn: input.page.urn,
    target_name: input.page.name,
    target_logo_url: input.page.logoUrl,
    admin_user_id: input.adminUserId,
    access_token_encrypted: input.accessToken ? encryptSecret(input.accessToken) : null,
    expires_at: input.expiresAt,
    scopes: input.scopes,
    connected_at: new Date().toISOString(),
  }

  const { error } = existing
    ? await supabase
        .from("linkedin_connection")
        .update(existing.target_urn === input.page.urn ? values : { ...values, last_import_at: null })
        .eq("id", CONNECTION_ID)
    : await supabase.from("linkedin_connection").insert({ id: CONNECTION_ID, ...values })

  if (error) throw new Error("La connexion LinkedIn n'a pas pu être enregistrée.")
}

export async function deleteConnection(): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("linkedin_connection").delete().eq("id", CONNECTION_ID)
  if (error) throw new Error("La page LinkedIn n'a pas pu être déconnectée.")
}

export async function markImported(at: Date): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("linkedin_connection")
    .update({ last_import_at: at.toISOString() })
    .eq("id", CONNECTION_ID)
  if (error) throw new Error("La date du dernier import n'a pas pu être enregistrée.")
}

const publicationContextSchema = z.object({
  connection: z
    .object({
      access_token_encrypted: z.string().nullable(),
      expires_at: z.string().nullable(),
    })
    .nullable(),
})

// Jeton de la connexion enregistrée. Le seul lecteur du jeton chiffré est la fonction
// `cron_publication_context`, protégée par CRON_SECRET : sans ce secret, renvoie null.
export async function readStoredToken(): Promise<{ token: string; expiresAt: string | null } | null> {
  const secret = process.env.CRON_SECRET
  if (!secret) return null

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("cron_publication_context", { p_secret: secret })
  if (error) throw new Error("Lecture du jeton LinkedIn impossible.")

  const parsed = publicationContextSchema.safeParse(data)
  const encrypted = parsed.success ? parsed.data.connection?.access_token_encrypted : null
  if (!parsed.success || !encrypted) return null

  try {
    return { token: decryptSecret(encrypted), expiresAt: parsed.data.connection?.expires_at ?? null }
  } catch {
    return null
  }
}
