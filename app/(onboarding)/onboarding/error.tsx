"use client"

import { CircleAlert } from "lucide-react"

import { SkipButton } from "@/components/onboarding/skip-button"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type OnboardingErrorProps = {
  error: Error & { digest?: string }
  // `retry` relit les données serveur de l'étape avant de l'afficher à nouveau (Next.js 16.3).
  retry: () => void
}

// Un simple lien vers « / » ramènerait ici tant que l'onboarding n'est pas terminé (contrat 2) :
// la sortie passe par « Passer », qui termine l'onboarding avec la ligne Neutre.
export default function OnboardingError({ retry }: OnboardingErrorProps) {
  return (
    <Empty className="rounded-xl bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlert className="text-destructive" />
        </EmptyMedia>
        <EmptyTitle>Impossible de charger cette étape</EmptyTitle>
        <EmptyDescription>Rechargez la page dans quelques instants.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center">
        <Button className="h-10 px-4" onClick={() => retry()}>
          Réessayer
        </Button>
        <SkipButton label="Passer et aller au calendrier" />
      </EmptyContent>
    </Empty>
  )
}
