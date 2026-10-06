"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { LinkedInApiError, fetchPagePosts } from "@/lib/linkedin/api"
import { getApiVersion, isLinkedInDemoMode } from "@/lib/linkedin/config"
import {
  deleteConnection,
  getLinkedInConnection,
  readStoredToken,
  saveConnection,
} from "@/lib/linkedin/connection"
import { DEMO_PAGES, buildDemoPosts } from "@/lib/linkedin/demo"
import { importPosts } from "@/lib/linkedin/import"
import { clearPendingConnection, readPendingConnection } from "@/lib/linkedin/oauth"
import {
  IMPORT_MAX_MONTHS,
  IMPORT_MAX_POSTS,
  LINKEDIN_ERROR_MESSAGES,
  connectionState,
  type ImportResult,
  type LinkedInPage,
  type RemotePost,
} from "@/lib/linkedin/types"
import { getSessionUserId } from "@/lib/parametrage/session"
import { isEditableLineCode, type ActionResult } from "@/lib/parametrage/types"
import { createClient } from "@/lib/supabase/server"

// Server Actions de la connexion à la page LinkedIn (spec Paramétrage E0, spec Création de post E7).
// Le jeton ne quitte jamais le serveur.

const NOT_SIGNED_IN = "Connectez-vous pour continuer."
const IMPORT_FAILED = "L'import des posts a échoué. Réessayez avec « Réimporter les posts »."

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error }
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

function importSince(): Date {
  const since = new Date()
  since.setMonth(since.getMonth() - IMPORT_MAX_MONTHS)
  return since
}

function importErrorMessage(error: unknown): string {
  if (error instanceof LinkedInApiError) {
    if (error.status === 401) return LINKEDIN_ERROR_MESSAGES.expired
    if (error.status === 403) return LINKEDIN_ERROR_MESSAGES.api_denied
  }
  return IMPORT_FAILED
}

// Ligne des posts importés : celle de l'admin s'il est rattaché à Marketing ou RH, sinon Marketing.
// L'import précède le choix de la ligne à l'onboarding, et un post importé ne change plus ensuite.
async function resolveImportLineId(userId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("line:editorial_lines!profiles_line_id_fkey(id, code)")
    .eq("id", userId)
    .maybeSingle()
  if (profile?.line && isEditableLineCode(profile.line.code)) return profile.line.id

  const { data: marketing } = await supabase
    .from("editorial_lines")
    .select("id")
    .eq("code", "marketing")
    .maybeSingle()
  return marketing?.id ?? null
}

async function runImport(userId: string, loadPosts: () => Promise<RemotePost[]>): Promise<ImportResult> {
  const [posts, lineId] = await Promise.all([loadPosts(), resolveImportLineId(userId)])
  return importPosts({ posts, authorId: userId, lineId })
}

// Connecte la page choisie puis importe ses posts. Un import en échec garde la connexion.
export async function connectLinkedInPage(
  urn: string
): Promise<ActionResult<{ pageName: string; imported: ImportResult | null; importError: string | null }>> {
  const parsedUrn = z.string().trim().min(1).max(200).safeParse(urn)
  if (!parsedUrn.success) return fail("Choisissez une page.")

  const userId = await getSessionUserId()
  if (!userId) return fail(NOT_SIGNED_IN)

  let page: LinkedInPage | undefined
  let loadPosts: () => Promise<RemotePost[]>

  if (isLinkedInDemoMode()) {
    page = DEMO_PAGES.find((candidate) => candidate.urn === parsedUrn.data)
    if (!page) return fail("Cette page n'est pas proposée.")
    try {
      await saveConnection({
        mode: "demo",
        page,
        accessToken: null,
        expiresAt: null,
        scopes: [],
        adminUserId: userId,
      })
    } catch (error) {
      return fail(errorMessage(error, LINKEDIN_ERROR_MESSAGES.error))
    }
    loadPosts = async () => buildDemoPosts(new Date())
  } else {
    const pending = await readPendingConnection()
    if (!pending) return fail("La connexion a expiré. Recommencez.")
    page = pending.pages.find((candidate) => candidate.urn === parsedUrn.data)
    if (!page) return fail("Choisissez une page que vous administrez.")
    try {
      await saveConnection({
        mode: "linkedin",
        page,
        accessToken: pending.accessToken,
        expiresAt: pending.expiresAt,
        scopes: pending.scopes,
        adminUserId: userId,
      })
    } catch (error) {
      return fail(errorMessage(error, LINKEDIN_ERROR_MESSAGES.error))
    }
    const organizationUrn = page.urn
    loadPosts = () =>
      fetchPagePosts({ token: pending.accessToken, apiVersion: getApiVersion() }, organizationUrn, {
        max: IMPORT_MAX_POSTS,
        since: importSince(),
      })
  }

  let imported: ImportResult | null = null
  let importError: string | null = null
  try {
    imported = await runImport(userId, loadPosts)
  } catch (error) {
    importError = importErrorMessage(error)
  }

  if (!isLinkedInDemoMode()) await clearPendingConnection()
  revalidatePath("/", "layout")
  return { ok: true, data: { pageName: page.name, imported, importError } }
}

// « Réimporter les posts » (E0, E7) : pas de synchronisation automatique en v1.
export async function reimportLinkedInPosts(): Promise<ActionResult<ImportResult>> {
  const userId = await getSessionUserId()
  if (!userId) return fail(NOT_SIGNED_IN)

  try {
    const connection = await getLinkedInConnection()
    if (!connection) return fail("Connectez d'abord la page LinkedIn.")

    let loadPosts: () => Promise<RemotePost[]>
    if (connection.mode === "demo") {
      loadPosts = async () => buildDemoPosts(new Date())
    } else {
      if (connectionState(connection) === "expired") return fail(LINKEDIN_ERROR_MESSAGES.expired)
      const stored = await readStoredToken()
      if (!stored) {
        return fail("Réimport impossible sans nouvelle connexion : reconnectez la page LinkedIn.")
      }
      loadPosts = () =>
        fetchPagePosts({ token: stored.token, apiVersion: getApiVersion() }, connection.targetUrn, {
          max: IMPORT_MAX_POSTS,
          since: importSince(),
        })
    }

    const result = await runImport(userId, loadPosts)
    revalidatePath("/", "layout")
    return { ok: true, data: result }
  } catch (error) {
    if (error instanceof LinkedInApiError) return fail(importErrorMessage(error))
    return fail(errorMessage(error, IMPORT_FAILED))
  }
}

export async function disconnectLinkedIn(): Promise<ActionResult> {
  const userId = await getSessionUserId()
  if (!userId) return fail(NOT_SIGNED_IN)

  try {
    await deleteConnection()
  } catch (error) {
    return fail(errorMessage(error, "La page LinkedIn n'a pas pu être déconnectée. Réessayez."))
  }

  revalidatePath("/", "layout")
  return { ok: true, data: null }
}

// « Annuler » au choix de la page : oublie le résultat de l'OAuth.
export async function cancelLinkedInChoice(): Promise<ActionResult> {
  const userId = await getSessionUserId()
  if (!userId) return fail(NOT_SIGNED_IN)

  await clearPendingConnection()
  return { ok: true, data: null }
}
