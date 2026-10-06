import { TriangleAlert } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { needsLineSetup, SETTINGS_LINES_HREF } from "@/lib/calendar"
import { createClient } from "@/lib/supabase/server"

// Bandeau « Ligne éditoriale non configurée » (contrat 3). Une lecture en échec n'affiche rien :
// le bandeau ne bloque jamais la page.
export async function LineBanner({ lineId }: { lineId: string | null }): Promise<ReactNode> {
  let line: { code: string; name: string; configured: boolean } | null = null

  if (lineId) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("editorial_lines")
      .select("code, name, configured")
      .eq("id", lineId)
      .maybeSingle()
    if (error) return null
    line = data
  }

  if (!needsLineSetup(line)) return null

  const description =
    line && line.code !== "neutre"
      ? `La ligne ${line.name} n'est pas encore activée : vos posts sont rédigés sans le ton de votre équipe.`
      : "Vos posts sont rédigés avec la ligne Neutre, sans le ton de votre équipe."

  // Le lien est hors de `AlertDescription`, qui impose aux liens la couleur du texte au survol.
  return (
    <Alert className="border-warning/40 bg-warning-surface text-warning">
      <TriangleAlert />
      <AlertTitle>Ligne éditoriale non configurée</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      <Link
        href={SETTINGS_LINES_HREF}
        className="col-start-2 mt-1 w-fit text-sm font-medium text-link underline-offset-4 hover:underline"
      >
        Configurer la ligne éditoriale
      </Link>
    </Alert>
  )
}
