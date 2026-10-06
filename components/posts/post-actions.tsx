"use client"

import { useMemo, useState, useSyncExternalStore, useTransition, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Archive,
  ArchiveRestore,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  archivePost,
  restorePost,
  schedulePost,
  unschedulePost,
  validatePost,
} from "@/app/(app)/posts/actions"
import { LinkedInPreviewDialog } from "@/components/posts/linkedin-preview-dialog"
import { ScheduleRecapDialog } from "@/components/posts/schedule-recap-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { scheduleBlockers } from "@/lib/scheduling"

// Heure courante arrondie à la minute : le motif « date passée » se met à jour sans action.
const MINUTE_MS = 60_000
const subscribeToClock = (onChange: () => void) => {
  const id = setInterval(onChange, MINUTE_MS / 4)
  return () => clearInterval(id)
}
const currentMinute = () => Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS

const SECONDARY = { variant: "secondary", size: "sm", className: "w-full" } as const

type ActionKey = "validate" | "schedule" | "unschedule" | "archive" | "restore"

function ArchiveDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archiver ce post ?</AlertDialogTitle>
          <AlertDialogDescription>
            Il disparaît de la liste et du calendrier. Rien n&apos;est supprimé sur LinkedIn.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="secondary">Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Archiver</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function SeriesNavigation({
  posts,
  currentId,
  onSelect,
}: {
  posts: EditorPost[]
  currentId: string
  onSelect: (postId: string) => void
}) {
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
  const nowMs = useSyncExternalStore(subscribeToClock, currentMinute, currentMinute)
  const [isPending, startTransition] = useTransition()
  const [activeAction, setActiveAction] = useState<ActionKey | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [recapOpen, setRecapOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  const imported = post.origin === "linkedin_import"
  const schedulable = !isReadOnly(post) && (post.status === "draft" || post.status === "failed")
  const blockers = useMemo(
    () =>
      schedulable && connection
        ? scheduleBlockers(post, { charter, connection, now: new Date(nowMs), requireValidated: false })
        : [],
    [schedulable, post, charter, connection, nowMs]
  )
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

  async function openRecap() {
    await flush()
    setRecapOpen(true)
  }

  return (
    <Card className="gap-2.5 p-5 ring-0">
      <h2 className="font-heading text-lg">Actions</h2>

      {schedulable && !connection && (
        <Button className="h-10 w-full px-4" nativeButton={false} render={<Link href={CONNECTION_SETTINGS_HREF} />}>
          <CalendarClock aria-hidden />
          Programmer ce post
        </Button>
      )}
      {schedulable && connection && (
        <div className="grid gap-1.5">
          <Button
            className="h-10 w-full px-4"
            disabled={disabled || blockers.length > 0}
            onClick={() => run("schedule", () => schedulePost(post.id), "Post programmé")}
          >
            {icon("schedule", CalendarClock)}
            Programmer ce post
          </Button>
          {blockers[0] && <p className="text-xs text-subtle-foreground">{blockers[0].message}</p>}
        </div>
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
      <ArchiveDialog
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
