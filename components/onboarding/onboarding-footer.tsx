import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"

import { SkipButton } from "@/components/onboarding/skip-button"
import { Button } from "@/components/ui/button"
import { ONBOARDING_STEPS, onboardingHref, type OnboardingStep } from "@/lib/parametrage/types"

// Barre d'actions collée en bas de l'écran : les étapes longues gardent « Passer » visible.
// La dernière étape se termine par « Activer la v1 », rendu dans le contenu de l'étape.
export function OnboardingFooter({ step }: { step: OnboardingStep }) {
  const index = ONBOARDING_STEPS.indexOf(step)
  const previous = index > 0 ? ONBOARDING_STEPS[index - 1] : null
  const next = index < ONBOARDING_STEPS.length - 1 ? ONBOARDING_STEPS[index + 1] : null

  return (
    <footer className="sticky bottom-6 z-10 flex items-center gap-2 rounded-xl bg-card p-3 shadow-float">
      {previous && (
        <Button
          variant="ghost"
          className="h-10 px-4 text-muted-foreground"
          nativeButton={false}
          render={<Link href={onboardingHref(previous)} />}
        >
          <ArrowLeft aria-hidden="true" />
          Précédent
        </Button>
      )}

      <div className="ml-auto flex items-center gap-2">
        <SkipButton />
        {next && (
          <Button
            className="h-10 px-4"
            nativeButton={false}
            render={<Link href={onboardingHref(next)} />}
          >
            Continuer
            <ArrowRight aria-hidden="true" />
          </Button>
        )}
      </div>
    </footer>
  )
}
