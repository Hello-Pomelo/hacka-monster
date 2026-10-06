import Link from "next/link"
import { Info } from "lucide-react"

import { ActivateLineButton } from "@/components/parametrage/lines/activate-line-button"
import { TestPostPanel } from "@/components/parametrage/lines/test-post-panel"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getEditorialLines } from "@/lib/parametrage/queries"
import { isEditableLineCode, onboardingHref } from "@/lib/parametrage/types"
import { requireProfile } from "@/lib/supabase/auth"

// Dernière étape de l'onboarding (E1, étape 5 ; US3) : post de test, puis « Activer la v1 ».
export async function OnboardingTestStep() {
  const [profile, lines] = await Promise.all([requireProfile(), getEditorialLines()])
  const myLine = lines.find((line) => line.id === profile.line_id) ?? null

  if (!myLine || !isEditableLineCode(myLine.code)) {
    return (
      <Alert className="rounded-xl border-0 px-4 py-3">
        <Info aria-hidden="true" />
        <AlertDescription className="text-foreground">
          <span>
            Choisissez d&apos;abord votre ligne à l&apos;étape{" "}
            <Link href={onboardingHref("identite")} className="text-link">
              Identité et exemples
            </Link>
            .
          </span>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-6">
      <TestPostPanel lineId={myLine.id} lineName={myLine.name} />
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-card p-4">
        <div className="grid gap-0.5">
          <p className="font-medium">Activer la ligne {myLine.name}</p>
          <p className="text-sm text-muted-foreground">
            L&apos;activation termine la configuration et ouvre le calendrier.
          </p>
        </div>
        <ActivateLineButton
          lineId={myLine.id}
          lineName={myLine.name}
          configured={myLine.configured}
          mode="onboarding"
        />
      </div>
    </div>
  )
}
