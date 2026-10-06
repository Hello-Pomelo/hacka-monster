import type { Metadata } from "next"
import { Suspense } from "react"
import { z } from "zod"

import { ConnectionStep } from "@/components/onboarding/connection-step"
import { OnboardingFooter } from "@/components/onboarding/onboarding-footer"
import { OnboardingHeader } from "@/components/onboarding/onboarding-header"
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress"
import { StepSkeleton } from "@/components/onboarding/step-skeleton"
import { CharterSection } from "@/components/parametrage/charter/charter-section"
import { OnboardingIdentityStep } from "@/components/parametrage/lines/onboarding-identity-step"
import { OnboardingTestStep } from "@/components/parametrage/lines/onboarding-test-step"
import { parseOnboardingStep, type OnboardingStep } from "@/lib/parametrage/types"

export const metadata: Metadata = { title: "Configurer l'outil" }

// Paramètre absent ou invalide : étape par défaut, sans erreur.
const searchSchema = z.object({
  etape: z.string().optional().catch(undefined),
  linkedin: z.string().optional().catch(undefined),
})

type OnboardingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function StepBody({ step, linkedinParam }: { step: OnboardingStep; linkedinParam: string | undefined }) {
  switch (step) {
    case "connexion":
      return <ConnectionStep linkedinParam={linkedinParam} />
    case "identite":
      return <OnboardingIdentityStep />
    case "charte":
      return <CharterSection variant="onboarding" />
    case "test":
      return <OnboardingTestStep />
  }
}

// Assistant de première connexion, 4 étapes passables (spec Paramétrage, E0, E1 et section 6).
export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const search = searchSchema.parse(await searchParams)
  const step = parseOnboardingStep(search.etape)

  return (
    <>
      <OnboardingHeader />
      <OnboardingProgress step={step} />
      <Suspense key={step} fallback={<StepSkeleton />}>
        <StepBody step={step} linkedinParam={search.linkedin} />
      </Suspense>
      <OnboardingFooter step={step} />
    </>
  )
}
