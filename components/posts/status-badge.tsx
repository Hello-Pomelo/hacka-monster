"use client"

// Client : `Badge` (Base UI) appelle des hooks client, interdits dans un Server Component.

import {
  Archive,
  Check,
  Clock,
  Hourglass,
  Loader,
  PencilLine,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { DISPLAY_LABELS, displayStatus, type DisplayStatus, type Post } from "@/lib/posts"
import { cn } from "@/lib/utils"

const STYLES: Record<
  DisplayStatus,
  { variant: "outline" | "secondary"; className: string; icon: LucideIcon }
> = {
  to_review: { variant: "outline", className: "text-muted-foreground", icon: PencilLine },
  draft: { variant: "outline", className: "text-muted-foreground", icon: PencilLine },
  pending: { variant: "secondary", className: "bg-warning-surface text-warning", icon: Hourglass },
  scheduled: { variant: "secondary", className: "bg-chip text-chip-foreground", icon: Clock },
  publishing: { variant: "secondary", className: "bg-chip text-chip-foreground", icon: Loader },
  published: { variant: "secondary", className: "bg-success-surface text-success", icon: Check },
  failed: { variant: "outline", className: "border-destructive text-destructive", icon: TriangleAlert },
  archived: { variant: "outline", className: "text-subtle-foreground", icon: Archive },
}

type StatusBadgeProps = {
  post: Pick<Post, "status" | "validated_at">
  className?: string
}

export function StatusBadge({ post, className }: StatusBadgeProps) {
  const shown = displayStatus(post)
  const { variant, className: style, icon: Icon } = STYLES[shown]

  return (
    <Badge
      variant={variant}
      className={cn("h-[22px] text-[11px] tracking-[0.05em] uppercase", style, className)}
    >
      <Icon aria-hidden />
      {DISPLAY_LABELS[shown]}
    </Badge>
  )
}
