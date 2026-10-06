// Types et libellés de la connexion LinkedIn (spec Paramétrage E0, spec Création de post E7).
// Utilisable côté serveur et client : aucun secret ici.

export type LinkedInPage = { urn: string; name: string; logoUrl: string | null }

// Connexion telle que lue par l'API : jamais le jeton chiffré.
export type LinkedInConnectionView = {
  mode: "linkedin" | "demo"
  targetUrn: string
  targetName: string
  targetLogoUrl: string | null
  adminUserId: string | null
  adminName: string | null
  expiresAt: string | null
  scopes: string[]
  lastImportAt: string | null
  connectedAt: string
}

export type ConnectionState = "disconnected" | "demo" | "connected" | "expiring" | "expired"

// Délai sous lequel l'expiration prochaine de la connexion est signalée.
export const EXPIRY_WARNING_DAYS = 7

const DAY_MS = 24 * 60 * 60 * 1000

export function connectionState(
  connection: LinkedInConnectionView | null,
  now: Date = new Date()
): ConnectionState {
  if (!connection) return "disconnected"
  if (connection.mode === "demo") return "demo"
  if (!connection.expiresAt) return "connected"

  const remaining = new Date(connection.expiresAt).getTime() - now.getTime()
  if (remaining <= 0) return "expired"
  if (remaining < EXPIRY_WARNING_DAYS * DAY_MS) return "expiring"
  return "connected"
}

export const LINKEDIN_ERROR_CODES = ["refused", "no_page", "api_denied", "expired", "error"] as const
export type LinkedInErrorCode = (typeof LINKEDIN_ERROR_CODES)[number]

export const LINKEDIN_ERROR_MESSAGES: Record<LinkedInErrorCode, string> = {
  refused: "La connexion a été refusée sur LinkedIn.",
  no_page: "Ce compte LinkedIn n'administre aucune page.",
  api_denied: "LinkedIn n'a pas encore accordé l'accès à l'API de gestion des pages.",
  expired: "La connexion à LinkedIn a expiré. Reconnectez la page.",
  error: "La connexion à LinkedIn a échoué. Réessayez dans un instant.",
}

// Valeur du paramètre d'URL `linkedin` au retour de l'OAuth : choix de la page, ou code d'erreur.
export type LinkedInParam = "choose" | LinkedInErrorCode

export function parseLinkedInParam(value: unknown): LinkedInParam | null {
  if (value === "choose") return "choose"
  if (typeof value === "string" && (LINKEDIN_ERROR_CODES as readonly string[]).includes(value)) {
    return value as LinkedInErrorCode
  }
  return null
}

export type ImportResult = { imported: number; skipped: number }

// Import des posts de la page (D23).
export const IMPORT_MAX_POSTS = 50
export const IMPORT_MAX_MONTHS = 12

// Post lu sur la page LinkedIn, avant import.
export type RemotePost = {
  urn: string
  text: string
  publishedAt: string
  hasImage: boolean
  url: string | null
}
