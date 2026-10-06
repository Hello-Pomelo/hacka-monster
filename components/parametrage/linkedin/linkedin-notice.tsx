import type { ReactNode } from "react"
import { FlaskConical, TriangleAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { LINKEDIN_ERROR_MESSAGES, type ConnectionState } from "@/lib/linkedin/types"

const DEMO_NOTICE =
  "Connexion simulée : LinkedIn n'est pas configuré sur le serveur. Les posts importés sont fictifs et rien n'est publié sur LinkedIn."

type LinkedInNoticeProps = {
  message: string
  // Phrase sous le message, par exemple la bascule sur le collage manuel.
  hint?: string
  // Actions proposées sous l'alerte.
  children?: ReactNode
}

// Échec de la connexion à LinkedIn (spec Paramétrage E0, spec Création de post E7).
export function LinkedInNotice({ message, hint, children }: LinkedInNoticeProps) {
  return (
    <Card className="ring-0">
      <CardContent className="grid gap-4">
        <Alert variant="destructive" className="border-destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>{message}</AlertTitle>
        </Alert>
        {hint && <p className="max-w-[640px] text-muted-foreground">{hint}</p>}
        {children && <div className="flex flex-wrap gap-2">{children}</div>}
      </CardContent>
    </Card>
  )
}

// Alerte sur la connexion enregistrée : simulée (mode démo) ou expirée. Rien dans les autres états.
export function ConnectionStateAlert({ state }: { state: ConnectionState }) {
  if (state === "demo") {
    return (
      <Alert role="note" className="border-transparent bg-chip text-chip-foreground">
        <FlaskConical aria-hidden="true" />
        <AlertDescription className="text-chip-foreground">{DEMO_NOTICE}</AlertDescription>
      </Alert>
    )
  }
  if (state === "expired") {
    return (
      <Alert variant="destructive" className="border-destructive">
        <TriangleAlert aria-hidden="true" />
        <AlertTitle>{LINKEDIN_ERROR_MESSAGES.expired}</AlertTitle>
      </Alert>
    )
  }
  return null
}
