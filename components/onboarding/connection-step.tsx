import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { LinkedInConnectionSection } from "@/components/parametrage/linkedin/linkedin-connection-section"
import { Button } from "@/components/ui/button"
import { getLinkedInConnection } from "@/lib/linkedin/connection"
import { parseLinkedInParam } from "@/lib/linkedin/types"
import { onboardingHref } from "@/lib/parametrage/types"

async function shouldOfferSkip(linkedinParam: string | undefined): Promise<boolean> {
  const param = parseLinkedInParam(linkedinParam)
  // Après une erreur LinkedIn, la section propose déjà « Coller mes posts à la main ».
  if (param !== null && param !== "choose") return false
  // Page déjà connectée : « Continuer » suffit.
  return (await getLinkedInConnection()) === null
}

// Étape 0 de l'onboarding (spec Paramétrage, E0) : même connexion que l'onglet Connexion LinkedIn.
export async function ConnectionStep({ linkedinParam }: { linkedinParam: string | undefined }) {
  const offerSkip = await shouldOfferSkip(linkedinParam)

  return (
    <div className="grid gap-4">
      <LinkedInConnectionSection
        variant="onboarding"
        returnTo={onboardingHref("connexion")}
        linkedinParam={linkedinParam}
        manualFallbackHref={onboardingHref("identite")}
      />

      {offerSkip && (
        <div className="grid justify-items-start gap-1">
          <Button
            variant="link"
            className="h-auto px-0 text-link"
            nativeButton={false}
            render={<Link href={onboardingHref("identite")} />}
          >
            Passer cette étape
            <ArrowRight aria-hidden="true" />
          </Button>
          <p className="text-sm text-subtle-foreground">
            Vous pourrez coller vos posts à la main. La programmation restera impossible tant que la
            page n&apos;est pas connectée.
          </p>
        </div>
      )}
    </div>
  )
}
