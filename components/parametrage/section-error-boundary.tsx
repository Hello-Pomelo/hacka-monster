"use client"

import { CircleAlert, RefreshCw } from "lucide-react"
import { catchError, type ErrorInfo } from "next/error"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type SectionErrorProps = { title: string }

// Erreur de lecture d'un onglet du paramétrage ou d'une étape de l'onboarding : l'en-tête, les
// onglets et la barre « Passer » restent affichés. `retry` relit les données du serveur.
function SectionError({ title }: SectionErrorProps, { retry }: ErrorInfo) {
  return (
    <Empty className="rounded-xl bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlert className="text-destructive" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>Rechargez la section dans quelques instants.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button className="h-10 px-4" onClick={() => retry()}>
          <RefreshCw aria-hidden="true" />
          Réessayer
        </Button>
      </EmptyContent>
    </Empty>
  )
}

export const SectionErrorBoundary = catchError(SectionError)
