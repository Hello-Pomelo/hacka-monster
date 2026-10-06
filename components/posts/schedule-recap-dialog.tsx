"use client"

import { TriangleAlert, X } from "lucide-react"
import Link from "next/link"
import {
  useMemo,
  useState,
  useTransition,
  type ReactNode,
  type TransitionStartFunction,
} from "react"
import { toast } from "sonner"

import { scheduleValidatedPosts } from "@/app/(app)/posts/actions"
import { LinkedInMissingBanner } from "@/components/posts/creation-banners"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import {
  CONNECTION_SETTINGS_HREF,
  CREATION_TEXTS,
  scheduledToast,
  type EditorPost,
  type LinkedInConnectionSummary,
} from "@/lib/creation"
import type { CharterRules } from "@/lib/guardrails"
import { postTitle } from "@/lib/posts"
import { buildScheduleRecap } from "@/lib/scheduling"
import { formatPlannedDate, isoToParis } from "@/lib/series"

const NOTHING_TO_SCHEDULE = "Aucun post validé à programmer."

type Recap = ReturnType<typeof buildScheduleRecap>

type ScheduleRecapDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  seriesId: string
  posts: EditorPost[]
  charter: CharterRules
  connection: LinkedInConnectionSummary | null
  onScheduled: (posts: EditorPost[]) => void
}

function plannedLabel(post: EditorPost): string {
  if (!post.scheduled_at) return "Non planifiée"
  const { day, time } = isoToParis(post.scheduled_at)
  const label = formatPlannedDate(day, time)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function RecapRow({ post, reason }: { post: EditorPost; reason?: string }) {
  return (
    <li className="grid gap-0.5 px-3 py-2.5">
      <span className="text-sm font-medium tabular-nums">{plannedLabel(post)}</span>
      <span className="truncate text-sm text-muted-foreground">{postTitle(post, 60)}</span>
      {reason && <span className="text-xs text-subtle-foreground">{reason}</span>}
    </li>
  )
}

function RecapSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h3 className="font-sans text-xs leading-normal font-medium tracking-[0.06em] text-subtle-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}

type ScheduleRecapBodyProps = Omit<ScheduleRecapDialogProps, "open" | "onOpenChange"> & {
  pending: boolean
  startTransition: TransitionStartFunction
  onClose: () => void
}

// Contenu monté à chaque ouverture : l'heure de référence et l'erreur de connexion repartent à zéro.
function ScheduleRecapBody({
  seriesId,
  posts,
  charter,
  connection,
  onScheduled,
  pending,
  startTransition,
  onClose,
}: ScheduleRecapBodyProps) {
  const [now] = useState(() => new Date())
  const [notConnected, setNotConnected] = useState(false)
  // Récapitulatif figé après succès, pour que la modale ne change pas pendant sa fermeture.
  const [done, setDone] = useState<Recap | null>(null)

  // Affichage seulement : scheduleValidatedPosts refait chaque contrôle côté serveur.
  const liveRecap = useMemo(
    () => buildScheduleRecap(posts, { charter, connection, now }),
    [posts, charter, connection, now]
  )
  const recap = done ?? liveRecap
  const blocked = connection === null || notConnected
  const canConfirm = !blocked && !pending && done === null && recap.eligible.length > 0
  const tokenExpired = recap.excluded.some(({ blockers }) => blockers[0]?.reason === "token_expired")

  function confirm() {
    const shown = liveRecap
    startTransition(async () => {
      const result = await scheduleValidatedPosts(seriesId)
      if (!result.ok) {
        toast.error(result.error)
        if (result.code === "not_connected") setNotConnected(true)
        return
      }

      const { scheduled, skipped } = result.data
      if (scheduled.length > 0) toast.success(scheduledToast(scheduled.length))
      else if (skipped.length === 0) toast.info(NOTHING_TO_SCHEDULE)
      for (const { postId, message } of skipped) {
        const post = posts.find((item) => item.id === postId)
        toast.warning(message, post ? { description: postTitle(post, 60) } : undefined)
      }

      setDone(shown)
      onScheduled(scheduled)
      onClose()
    })
  }

  return (
    <>
      <div className="-mx-6 grid min-h-0 flex-1 content-start gap-5 overflow-y-auto px-6">
        {blocked && <LinkedInMissingBanner />}

        <RecapSection title={`À programmer (${recap.eligible.length})`}>
          {recap.eligible.length > 0 ? (
            <ul className="divide-y rounded-lg border">
              {recap.eligible.map((post) => (
                <RecapRow key={post.id} post={post} />
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">{NOTHING_TO_SCHEDULE}</p>
          )}
        </RecapSection>

        {recap.excluded.length > 0 && (
          <RecapSection title={`Exclus (${recap.excluded.length})`}>
            <ul className="divide-y rounded-lg border">
              {recap.excluded.map(({ post, blockers }) => (
                <RecapRow key={post.id} post={post} reason={blockers[0]?.message} />
              ))}
            </ul>
            {tokenExpired && (
              <Link
                href={CONNECTION_SETTINGS_HREF}
                className="w-fit text-sm font-medium text-link underline underline-offset-3"
              >
                Reconnecter la page
              </Link>
            )}
          </RecapSection>
        )}

        {recap.noClients && (
          <p className="flex items-start gap-2 text-xs text-warning">
            <TriangleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
            {CREATION_TEXTS.noClients}
          </p>
        )}
      </div>

      <DialogFooter className="m-0 rounded-none border-0 bg-transparent p-0">
        <DialogClose
          disabled={pending}
          render={<Button variant="secondary" className="h-10 px-4" />}
        >
          Annuler
        </DialogClose>
        <Button className="h-10 px-4" onClick={confirm} disabled={!canConfirm}>
          {pending && <Spinner aria-label="Programmation en cours" />}
          Confirmer
        </Button>
      </DialogFooter>
    </>
  )
}

// E5 : récapitulatif avant de programmer les posts validés de la série.
export function ScheduleRecapDialog({ open, onOpenChange, ...body }: ScheduleRecapDialogProps) {
  const [pending, startTransition] = useTransition()

  // Pas de fermeture pendant l'envoi : le résultat doit s'afficher dans la modale ou en toast.
  function handleOpenChange(next: boolean) {
    if (!next && pending) return
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100dvh-2rem)] flex-col gap-5 p-6 sm:max-w-[560px]"
      >
        <DialogHeader className="pr-10">
          <DialogTitle className="text-2xl leading-[1.05]">Programmer les posts validés</DialogTitle>
          <DialogDescription>Ces posts partiront automatiquement à la date indiquée.</DialogDescription>
        </DialogHeader>
        <DialogClose
          aria-label="Fermer"
          disabled={pending}
          render={<Button variant="ghost" size="icon" className="absolute top-5 right-5" />}
        >
          <X aria-hidden />
        </DialogClose>

        <ScheduleRecapBody
          {...body}
          pending={pending}
          startTransition={startTransition}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
