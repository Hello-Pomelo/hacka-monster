"use client"

import Link from "next/link"
import { RotateCw } from "lucide-react"

import { PageFallback } from "@/components/posts/page-fallback"
import { Button } from "@/components/ui/button"

type SeriesErrorProps = {
  error: Error & { digest?: string }
  retry: () => void
}

// Lecture de la série, des lignes éditoriales ou de la charte impossible (E2).
export default function SeriesError({ retry }: SeriesErrorProps) {
  return (
    <PageFallback title="Impossible de charger la série" description="Réessayez dans quelques instants.">
      <Button className="h-10 px-4" onClick={() => retry()}>
        <RotateCw aria-hidden />
        Réessayer
      </Button>
      <Button variant="secondary" className="h-10 px-4" nativeButton={false} render={<Link href="/" />}>
        Mon calendrier
      </Button>
    </PageFallback>
  )
}
