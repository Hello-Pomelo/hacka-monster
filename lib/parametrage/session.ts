import "server-only"

import { createClient } from "@/lib/supabase/server"

// Identifiant de l'utilisateur connecté, ou null sans session.
export async function getSessionUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  return data?.claims.sub ?? null
}
