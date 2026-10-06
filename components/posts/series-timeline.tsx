"use client"

import {
  Archive,
  Check,
  Clock,
  Hourglass,
  Loader,
  PencilLine,
  RotateCw,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useRef } from "react"

import type { PostGenerationStatus, SeriesGenerationState } from "@/components/posts/use-series-generation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CREATION_TEXTS, type EditorPost } from "@/lib/creation"
import { DISPLAY_LABELS, displayStatus, type DisplayStatus } from "@/lib/posts"
import { formatPlannedDateShort, isoToParis } from "@/lib/series"
import { cn } from "@/lib/utils"

type SeriesTimelineProps = {
  posts: EditorPost[]
  currentPostId: string
  generation: SeriesGenerationState
  onSelect: (postId: string) => void
}

// État d'un post écrit, tel que la frise l'affiche (spec Création de post, E3).
const STATES: Record<DisplayStatus, { label: string; icon: LucideIcon; className: string }> = {
  to_review: { label: DISPLAY_LABELS.to_review, icon: PencilLine, className: "text-muted-foreground" },
  draft: { label: "Validé", icon: Check, className: "text-foreground" },
  pending: { label: DISPLAY_LABELS.pending, icon: Hourglass, className: "text-warning" },
  scheduled: { label: DISPLAY_LABELS.scheduled, icon: Clock, className: "text-chip-foreground" },
  publishing: { label: DISPLAY_LABELS.publishing, icon: Loader, className: "text-chip-foreground" },
  published: { label: DISPLAY_LABELS.published, icon: Check, className: "text-success" },
  failed: { label: "En échec", icon: TriangleAlert, className: "text-destructive" },
  archived: { label: DISPLAY_LABELS.archived, icon: Archive, className: "text-subtle-foreground" },
}

function plannedLabel(post: EditorPost): string {
  const iso = post.scheduled_at ?? post.published_at
  if (!iso) return "Non planifiée"
  const { day, time } = isoToParis(iso)
  const label = formatPlannedDateShort(day, time)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

type MarkerStateProps = {
  id: string
  post: EditorPost
  status: PostGenerationStatus
  onRetry: () => void
}

function MarkerState({ id, post, status, onRetry }: MarkerStateProps) {
  if (status === "writing" || status === "queued") {
    return (
      <div id={id} className="flex flex-col gap-1.5">
        <Skeleton className="h-1.5 w-full bg-chip" />
        <span className="flex items-center gap-1 text-xs text-subtle-foreground">
          <Loader aria-hidden className="size-3 animate-spin" />
          {CREATION_TEXTS.writing}
        </span>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div id={id} className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-xs text-destructive">
          <TriangleAlert aria-hidden className="size-3" />
          Échec de l&apos;écriture
        </span>
        <Button
          type="button"
          variant="link"
          size="xs"
          className="relative z-10 h-auto px-0"
          onClick={(event) => {
            event.stopPropagation()
            onRetry()
          }}
        >
          <RotateCw aria-hidden />
          Relancer
        </Button>
      </div>
    )
  }

  if (!post.content.trim()) {
    return (
      <div id={id} className="flex items-center gap-1 text-xs text-subtle-foreground">
        <PencilLine aria-hidden className="size-3" />À écrire
      </div>
    )
  }

  const { label, icon: Icon, className } = STATES[displayStatus(post)]
  return (
    <div id={id} className={cn("flex items-center gap-1 text-xs", className)}>
      <Icon aria-hidden className="size-3" />
      {label}
    </div>
  )
}

// Frise de navigation de E3 : un repère par post de la série, avec sa date et son état.
export function SeriesTimeline({ posts, currentPostId, generation, onSelect }: SeriesTimelineProps) {
  const navRef = useRef<HTMLElement>(null)

  // Garde le repère courant visible quand l'auteur passe au post suivant.
  useEffect(() => {
    const nav = navRef.current
    const marker = nav?.querySelector<HTMLElement>("[data-current]")
    if (!nav || !marker) return
    const bounds = nav.getBoundingClientRect()
    const box = marker.getBoundingClientRect()
    if (box.left < bounds.left) nav.scrollBy({ left: box.left - bounds.left - 8, behavior: "smooth" })
    else if (box.right > bounds.right) nav.scrollBy({ left: box.right - bounds.right + 8, behavior: "smooth" })
  }, [currentPostId])

  return (
    <nav ref={navRef} aria-label="Posts de la série" className="-m-1 overflow-x-auto p-1">
      <ol className="flex gap-2">
        {posts.map((post, index) => {
          const isCurrent = post.id === currentPostId
          const stateId = `series-timeline-${post.id}`
          return (
            <li
              key={post.id}
              data-current={isCurrent ? "" : undefined}
              className={cn(
                "relative flex min-w-[150px] shrink-0 flex-col gap-1 rounded-lg border px-3 py-2 text-left transition-colors",
                isCurrent ? "border-primary bg-tag" : "bg-card hover:border-input",
                post.status === "archived" && "opacity-60"
              )}
            >
              <button
                type="button"
                aria-current={isCurrent ? "step" : undefined}
                aria-describedby={stateId}
                onClick={() => onSelect(post.id)}
                className="text-left text-[13px] font-medium whitespace-nowrap tabular-nums outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
              >
                <span className="sr-only">{`Post ${index + 1} sur ${posts.length} : `}</span>
                {plannedLabel(post)}
              </button>
              <MarkerState
                id={stateId}
                post={post}
                status={generation.statusById[post.id] ?? "idle"}
                onRetry={() => generation.retry(post.id)}
              />
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
