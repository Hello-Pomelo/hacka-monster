"use client"

import { CircleAlert } from "lucide-react"
import Link from "next/link"

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
        <Button
          variant="secondary"
          className="h-10 px-4"
          nativeButton={false}
          render={<Link href="/" />}
        >
          Aller au calendrier
        </Button>
      </EmptyContent>
    </Empty>
  )
}
