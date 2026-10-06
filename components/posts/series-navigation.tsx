"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { EditorPost } from "@/lib/creation"

type SeriesNavigationProps = {
  posts: EditorPost[]
  currentId: string
  onSelect: (postId: string) => void
}

// Précédent et Suivant dans la série (E3), dans l'ordre de la frise.
export function SeriesNavigation({ posts, currentId, onSelect }: SeriesNavigationProps) {
  const index = posts.findIndex((item) => item.id === currentId)
  const previous = index > 0 ? posts[index - 1] : null
  const next = index >= 0 && index < posts.length - 1 ? posts[index + 1] : null

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button variant="secondary" size="sm" disabled={!previous} onClick={() => previous && onSelect(previous.id)}>
        <ChevronLeft aria-hidden />
        Précédent
      </Button>
      <Button variant="secondary" size="sm" disabled={!next} onClick={() => next && onSelect(next.id)}>
        Suivant
        <ChevronRight aria-hidden />
      </Button>
    </div>
  )
}
