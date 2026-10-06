import type { ReactNode } from "react"
import { CircleAlert, type LucideIcon } from "lucide-react"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

type PageFallbackProps = {
  title: string
  description: string
  icon?: LucideIcon
  // Erreur de lecture : icône rouge. Contenu introuvable : icône neutre.
  tone?: "error" | "neutral"
  className?: string
  // Actions proposées : réessayer, revenir à la liste.
  children?: ReactNode
}

// Écran affiché à la place du contenu quand il ne peut pas être lu ou n'existe pas.
export function PageFallback({
  title,
  description,
  icon: Icon = CircleAlert,
  tone = "error",
  className,
  children,
}: PageFallbackProps) {
  return (
    <Empty className={cn("rounded-xl bg-card", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon aria-hidden className={tone === "error" ? "text-destructive" : undefined} />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children && <EmptyContent className="flex-row justify-center gap-2">{children}</EmptyContent>}
    </Empty>
  )
}
