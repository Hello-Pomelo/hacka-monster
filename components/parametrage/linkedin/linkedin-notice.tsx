import type { ReactNode } from "react"
import { TriangleAlert } from "lucide-react"

import { Alert, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"

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
