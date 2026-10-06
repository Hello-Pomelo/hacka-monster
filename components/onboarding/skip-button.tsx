"use client"

import { useTransition } from "react"
import { unstable_rethrow } from "next/navigation"
import { toast } from "sonner"

import { finishOnboarding } from "@/app/(onboarding)/onboarding/actions"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

const SKIP_DESCRIPTION = "Aller au calendrier avec la ligne Neutre"

// « Passer » : termine l'onboarding à n'importe quelle étape (D13). En cas de succès, l'action
// redirige vers le calendrier : `unstable_rethrow` laisse la redirection au routeur.
export function SkipButton({ label = "Passer" }: { label?: string }) {
  const [pending, startTransition] = useTransition()

  function skip() {
    startTransition(async () => {
      try {
        const result = await finishOnboarding()
        if (result && !result.ok) toast.error(result.error)
      } catch (error) {
        unstable_rethrow(error)
        toast.error("La configuration n'a pas pu être terminée. Vérifiez votre connexion puis réessayez.")
      }
    })
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className="h-10 px-4"
      title={SKIP_DESCRIPTION}
      aria-description={SKIP_DESCRIPTION}
      disabled={pending}
      onClick={skip}
    >
      {pending && <Spinner aria-hidden="true" />}
      {label}
    </Button>
  )
}
