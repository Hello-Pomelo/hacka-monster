"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { reimportLinkedInPosts } from "@/app/(app)/parametrage/linkedin-actions"
import { Button } from "@/components/ui/button"
import { Progress, ProgressLabel } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { formatImportCount } from "@/lib/parametrage/format"

const IMPORT_FAILED = "L'import des posts a échoué. Vérifiez votre connexion puis réessayez."

// Barre d'attente de l'import (spec Paramétrage, E0). La durée réelle est inconnue :
// la valeur avance vers 90 % sans l'atteindre, et le libellé est lu à la place du pourcentage.
export function ImportProgress({ label }: { label: string }) {
  const [value, setValue] = useState(8)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setValue((current) => current + (90 - current) * 0.12)
    }, 500)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <Progress value={Math.round(value)} getAriaValueText={() => label} className="gap-2">
      <ProgressLabel className="text-xs font-normal text-muted-foreground">{label}</ProgressLabel>
    </Progress>
  )
}

// « Réimporter les posts » (spec Paramétrage E0, spec Création de post E7) : pas de synchronisation automatique.
export function ReimportButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function reimport() {
    startTransition(async () => {
      try {
        const result = await reimportLinkedInPosts()
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        toast(formatImportCount(result.data.imported))
        router.refresh()
      } catch {
        toast.error(IMPORT_FAILED)
      }
    })
  }

  return (
    <div className="grid gap-2">
      <Button variant="secondary" className="h-10 px-4" disabled={pending} onClick={reimport}>
        {pending ? <Spinner aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
        Réimporter les posts
      </Button>
      {pending && <ImportProgress label="Import en cours…" />}
    </div>
  )
}
