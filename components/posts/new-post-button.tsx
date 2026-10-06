import type { ComponentProps, ReactNode } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { PostTypeId } from "@/lib/post-types"

export type NewPostPrefill = {
  date?: string
  subject?: string
  type?: PostTypeId
  lineCode?: "marketing" | "rh"
  ideaId?: string
  suggestionKey?: string
}

// Lien vers l'écran de création, avec le préremplissage en paramètres d'URL.
export function newPostHref(prefill?: NewPostPrefill): string {
  const params = new URLSearchParams()
  if (prefill) {
    for (const [key, value] of Object.entries(prefill)) {
      if (value) params.set(key, value)
    }
  }
  const query = params.toString()
  return query ? `/posts/new?${query}` : "/posts/new"
}

type NewPostButtonProps = {
  prefill?: NewPostPrefill
  variant?: ComponentProps<typeof Button>["variant"]
  size?: ComponentProps<typeof Button>["size"]
  className?: string
  children: ReactNode
}

export function NewPostButton({ prefill, variant, size, className, children }: NewPostButtonProps) {
  return (
    <Button
      nativeButton={false}
      render={<Link href={newPostHref(prefill)} />}
      variant={variant}
      size={size}
      className={className}
    >
      {children}
    </Button>
  )
}

// Bouton flottant centré sur la zone principale (barre latérale de 248 px).
export function NewPostFab() {
  return (
    <NewPostButton className="fixed bottom-6 left-[calc(50%+124px)] z-20 h-12 -translate-x-1/2 gap-2 px-5 text-[15px] shadow-float">
      <Plus aria-hidden="true" className="size-5" />
      Créer un nouveau post
    </NewPostButton>
  )
}
