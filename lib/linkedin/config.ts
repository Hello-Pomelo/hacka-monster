import "server-only"

// Scopes de la Community Management API : lire et publier les posts d'une page.
// rw_organization_admin sert à lister les pages administrées (organizationAcls).
// À vérifier sur l'app LinkedIn réelle : jamais exercés pendant le développement.
export const LINKEDIN_SCOPES = "r_organization_social w_organization_social rw_organization_admin"

// Version mensuelle de l'API REST (AAAAMM), supportée environ un an par LinkedIn.
const DEFAULT_API_VERSION = "202607"

export type LinkedInConfig = { clientId: string; clientSecret: string; apiVersion: string }

// Sans LINKEDIN_CLIENT_ID, la connexion est simulée (mode démo).
export function isLinkedInDemoMode(): boolean {
  return !process.env.LINKEDIN_CLIENT_ID
}

export function getApiVersion(): string {
  return process.env.LINKEDIN_API_VERSION || DEFAULT_API_VERSION
}

// Lu à l'appel et non au chargement du module : les variables ne sont pas toutes disponibles au build.
// Renvoie null en mode démo.
export function getLinkedInConfig(): LinkedInConfig | null {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  if (!clientId) return null

  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  if (!clientSecret || !process.env.LINKEDIN_TOKEN_KEY) {
    throw new Error(
      "LINKEDIN_CLIENT_SECRET et LINKEDIN_TOKEN_KEY sont requis quand LINKEDIN_CLIENT_ID est renseigné."
    )
  }
  return { clientId, clientSecret, apiVersion: getApiVersion() }
}

// Doit correspondre exactement à une URL de redirection déclarée dans l'app LinkedIn.
export function getRedirectUri(origin: string): string {
  return `${origin}/api/linkedin/callback`
}
