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

export default function StatsError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <Empty role="alert" className="rounded-xl bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlert className="text-destructive" />
        </EmptyMedia>
        <EmptyTitle>
          <h1 className="text-lg">Statistiques indisponibles</h1>
        </EmptyTitle>
        <EmptyDescription>
          Le chargement des statistiques a échoué. Vérifiez votre connexion, puis réessayez.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="secondary" className="h-10 px-4" onClick={() => retry()}>
          <RefreshCw aria-hidden />
          Réessayer
        </Button>
      </EmptyContent>
    </Empty>
  )
}
