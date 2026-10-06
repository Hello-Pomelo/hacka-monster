"use client"

import { useMemo, useSyncExternalStore } from "react"
import Link from "next/link"
import { CalendarClock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { CONNECTION_SETTINGS_HREF, type EditorPost, type LinkedInConnectionSummary } from "@/lib/creation"
import type { CharterRules } from "@/lib/guardrails"
import { scheduleBlockers } from "@/lib/scheduling"

// Heure courante arrondie à la minute : le motif « date passée » se met à jour sans action.
const MINUTE_MS = 60_000
const subscribeToClock = (onChange: () => void) => {
  const id = setInterval(onChange, MINUTE_MS / 4)
  return () => clearInterval(id)
}
const currentMinute = () => Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS

type SchedulePostButtonProps = {
  // Post courant, avec le texte en cours de saisie.
  post: EditorPost
  charter: CharterRules
  connection: LinkedInConnectionSummary | null
  disabled: boolean
  pending: boolean
  onSchedule: () => void
}

// « Programmer ce post » (E3, spec Création de post P0 6). Sans page connectée, le bouton mène à la
// connexion et le post reste en Brouillon. Sinon, il reste désactivé avec le premier motif tant
// qu'une condition manque ; le serveur refait le contrôle.
export function SchedulePostButton({
  post,
  charter,
  connection,
  disabled,
  pending,
  onSchedule,
}: SchedulePostButtonProps) {
  const nowMs = useSyncExternalStore(subscribeToClock, currentMinute, currentMinute)
  const blockers = useMemo(
    () =>
      connection
        ? scheduleBlockers(post, { charter, connection, now: new Date(nowMs), requireValidated: false })
        : [],
    [post, charter, connection, nowMs]
  )

  if (!connection) {
    return (
      <Button className="h-10 w-full px-4" nativeButton={false} render={<Link href={CONNECTION_SETTINGS_HREF} />}>
        <CalendarClock aria-hidden />
        Programmer ce post
      </Button>
    )
  }

  return (
    <div className="grid gap-1.5">
      <Button className="h-10 w-full px-4" disabled={disabled || blockers.length > 0} onClick={onSchedule}>
        {pending ? <Spinner aria-hidden /> : <CalendarClock aria-hidden />}
        Programmer ce post
      </Button>
      {blockers[0] && <p className="text-xs text-subtle-foreground">{blockers[0].message}</p>}
    </div>
  )
}
