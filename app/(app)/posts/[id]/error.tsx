"use client"

import Link from "next/link"
import { RotateCw } from "lucide-react"

import { PageFallback } from "@/components/posts/page-fallback"
import { Button } from "@/components/ui/button"

type PostErrorProps = {
  error: Error & { digest?: string }
  retry: () => void
}

// Lecture du post, de sa série, de la charte ou de la connexion impossible (E3).
export default function PostError({ retry }: PostErrorProps) {
  return (
    <PageFallback title="Impossible de charger le post" description="Réessayez dans quelques instants.">
      <Button className="h-10 px-4" onClick={() => retry()}>
        <RotateCw aria-hidden />
        Réessayer
      </Button>
      <Button variant="secondary" className="h-10 px-4" nativeButton={false} render={<Link href="/posts" />}>
        Tous les posts
      </Button>
    </PageFallback>
  )
}
