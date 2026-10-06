"use client"

import { CircleAlert, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type ParametrageErrorProps = {
  error: Error & { digest?: string }
  // Next.js 16.3 : `retry` relit les données du serveur, `reset` réaffiche seulement le rendu en erreur.
  retry: () => void
}

export default function ParametrageError({ retry }: ParametrageErrorProps) {
  return (
    <Empty className="rounded-xl bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlert className="text-destructive" />
        </EmptyMedia>
        <EmptyTitle>Impossible de charger le paramétrage</EmptyTitle>
        <EmptyDescription>Rechargez la page dans quelques instants.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button className="h-10 px-4" onClick={() => retry()}>
          <RefreshCw aria-hidden />
          Réessayer
        </Button>
      </EmptyContent>
    </Empty>
  )
}
