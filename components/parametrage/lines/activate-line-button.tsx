"use client"

import { useTransition } from "react"
import { unstable_rethrow, useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { toast } from "sonner"

import { activateLine } from "@/app/(app)/parametrage/actions"
import { finishOnboarding } from "@/app/(onboarding)/onboarding/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type ActivateLineButtonProps = {
  lineId: string
  lineName: string
  configured: boolean
  mode: "settings" | "onboarding"
}

// « Activer la v1 » (E1, étape 5) : editorial_lines.configured = true (contrat 3).
// Dans l'onboarding, l'activation termine aussi la configuration et ouvre le calendrier.
export function ActivateLineButton({ lineId, lineName, configured, mode }: ActivateLineButtonProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  if (mode === "settings" && configured) {
    return (
      <Badge
        variant="secondary"
        className="h-[22px] bg-success-surface text-[11px] tracking-[0.05em] text-success uppercase"
      >
        <Check aria-hidden="true" />
        Ligne active
      </Badge>
    )
  }

  function activate() {
    startTransition(async () => {
      try {
        const result = await activateLine(lineId)
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        toast.success(`Ligne ${lineName} activée`)
        if (mode === "settings") {
          router.refresh()
          return
        }
        // Redirige vers le calendrier en cas de succès : `unstable_rethrow` la laisse au routeur.
        const finished = await finishOnboarding()
        if (finished && !finished.ok) toast.error(finished.error)
      } catch (error) {
        unstable_rethrow(error)
        toast.error("La ligne n'a pas pu être activée. Vérifiez votre connexion puis réessayez.")
      }
    })
  }

  return (
    <Button className="h-10 px-4" onClick={activate} disabled={pending}>
      {pending ? <Spinner aria-hidden="true" /> : <Check aria-hidden="true" />}
      Activer la v1
    </Button>
  )
}
