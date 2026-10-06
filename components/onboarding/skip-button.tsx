"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { finishOnboarding } from "@/app/(onboarding)/onboarding/actions"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

const SKIP_DESCRIPTION = "Aller au calendrier avec la ligne Neutre"

// « Passer » : termine l'onboarding à n'importe quelle étape (D13). En cas de succès,
// l'action redirige vers le calendrier ; la redirection est traitée par le routeur.
export function SkipButton() {
  const [pending, startTransition] = useTransition()

  function skip() {
    startTransition(async () => {
      const result = await finishOnboarding()
      if (result && !result.ok) toast.error(result.error)
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
      Passer
    </Button>
  )
}
