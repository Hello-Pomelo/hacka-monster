"use client"

import { useState, useTransition, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Archive, ArchiveRestore, CalendarCheck, CalendarX, Check, Eye, type LucideIcon } from "lucide-react"
import { toast } from "sonner"

import {
  archivePost,
  restorePost,
  schedulePost,
  unschedulePost,
  validatePost,
} from "@/app/(app)/posts/actions"
import { ArchivePostDialog } from "@/components/posts/archive-post-dialog"
import { LinkedInPreviewDialog } from "@/components/posts/linkedin-preview-dialog"
import { SchedulePostButton } from "@/components/posts/schedule-post-button"
import { ScheduleRecapDialog } from "@/components/posts/schedule-recap-dialog"
import { SeriesNavigation } from "@/components/posts/series-navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  CONNECTION_SETTINGS_HREF,
  type ActionResult,
  type EditorPost,
  type LinkedInConnectionSummary,
} from "@/lib/creation"
import type { CharterRules } from "@/lib/guardrails"
import { isReadOnly, publicImageUrl } from "@/lib/posts"

const SECONDARY = { variant: "secondary", size: "sm", className: "w-full" } as const

type ActionKey = "validate" | "schedule" | "unschedule" | "archive" | "restore"

type PostActionsProps = {
  // Post courant, avec le texte en cours de saisie.
  post: EditorPost
  seriesPosts: EditorPost[]
  charter: CharterRules
  connection: LinkedInConnectionSummary | null
  // Génération en cours sur ce post : les actions d'édition attendent.
  busy: boolean
  flush: () => Promise<boolean>
  onSelect: (postId: string) => void
  onReplace: (post: EditorPost) => void
  onReplaceMany: (posts: EditorPost[]) => void
}

// Actions du post courant (E3), affichées selon son statut. Un post en lecture seule n'a plus
// d'action d'édition ; l'archivage reste possible pour un post Publié (spec P0 8).
export function PostActions({
  post,
  seriesPosts,
  charter,
  connection,
  busy,
  flush,
  onSelect,
  onReplace,
  onReplaceMany,
}: PostActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeAction, setActiveAction] = useState<ActionKey | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [recapOpen, setRecapOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  const imported = post.origin === "linkedin_import"
  const schedulable = !isReadOnly(post) && (post.status === "draft" || post.status === "failed")
  const hasRecapCandidates = seriesPosts.some((item) => item.status === "draft" || item.status === "failed")
  const disabled = isPending || busy

  function run(key: ActionKey, action: () => Promise<ActionResult<EditorPost>>, success: string) {
    setActiveAction(key)
    startTransition(async () => {
      try {
        // Le texte en attente part d'abord : l'action porte sur la dernière version.
        if (!(await flush())) return
        const result = await action()
        if (result.ok) {
          onReplace(result.data)
          toast.success(success)
        } else {
          toast.error(result.error)
          if (result.code === "not_connected") router.push(CONNECTION_SETTINGS_HREF)
        }
      } catch {
        toast.error("L'action a échoué. Réessayez.")
      } finally {
        setActiveAction(null)
      }
    })
  }

  function icon(key: ActionKey, Icon: LucideIcon): ReactNode {
    return isPending && activeAction === key ? <Spinner aria-hidden /> : <Icon aria-hidden />
  }

  // Les textes en attente partent d'abord : le récapitulatif porte sur la dernière version.
  async function openRecap() {
    if (await flush()) setRecapOpen(true)
  }

  return (
    <Card className="gap-2.5 p-5 ring-0">
      <h2 className="font-heading text-lg">Actions</h2>

      {schedulable && (
        <SchedulePostButton
          post={post}
          charter={charter}
          connection={connection}
          disabled={disabled}
          pending={isPending && activeAction === "schedule"}
          onSchedule={() => run("schedule", () => schedulePost(post.id), "Post programmé")}
        />
      )}

      {schedulable && !post.validated_at && (
        <Button {...SECONDARY} disabled={disabled} onClick={() => run("validate", () => validatePost(post.id), "Post validé")}>
          {icon("validate", Check)}
          Valider
        </Button>
      )}
      {schedulable && post.validated_at && (
        <p className="flex items-center gap-1.5 text-xs text-success">
          <Check aria-hidden className="size-3.5" />
          Validé : prêt à programmer.
        </p>
      )}

      {post.series_id && !imported && hasRecapCandidates && (
        <Button {...SECONDARY} disabled={disabled} onClick={() => void openRecap()}>
          <CalendarCheck aria-hidden />
          Programmer les posts validés
        </Button>
      )}

      {post.status === "scheduled" && !imported && (
        <Button
          {...SECONDARY}
          disabled={disabled}
          onClick={() => run("unschedule", () => unschedulePost(post.id), "Post déprogrammé")}
        >
          {icon("unschedule", CalendarX)}
          Déprogrammer
        </Button>
      )}

      {post.status === "archived" && !imported && (
        <Button {...SECONDARY} disabled={disabled} onClick={() => run("restore", () => restorePost(post.id), "Post restauré")}>
          {icon("restore", ArchiveRestore)}
          Restaurer
        </Button>
      )}

      <Button {...SECONDARY} onClick={() => setPreviewOpen(true)}>
        <Eye aria-hidden />
        Aperçu
      </Button>

      {!imported && post.status !== "publishing" && post.status !== "archived" && (
        <Button {...SECONDARY} disabled={disabled} onClick={() => setArchiveOpen(true)}>
          {icon("archive", Archive)}
          Archiver
        </Button>
      )}

      {post.series_id && seriesPosts.length > 1 && (
        <>
          <Separator className="my-1" />
          <SeriesNavigation posts={seriesPosts} currentId={post.id} onSelect={onSelect} />
        </>
      )}

      <LinkedInPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        text={post.content}
        imageUrl={post.image_path ? publicImageUrl(post.image_path) : null}
        imageAlt={post.image_alt}
        pageName={connection?.targetName ?? "Hello Pomelo"}
        pageLogoUrl={connection?.targetLogoUrl ?? null}
      />
      {post.series_id && (
        <ScheduleRecapDialog
          open={recapOpen}
          onOpenChange={setRecapOpen}
          seriesId={post.series_id}
          posts={seriesPosts}
          charter={charter}
          connection={connection}
          onScheduled={onReplaceMany}
        />
      )}
      <ArchivePostDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        onConfirm={() => {
          setArchiveOpen(false)
          run("archive", () => archivePost(post.id), "Post archivé")
        }}
      />
    </Card>
  )
}
