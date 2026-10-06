import Link from "next/link"

import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

type LinkedInState = { label: string; tone: "ok" | "warn" | "off" }

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Paris",
})

// Délai sous lequel l'expiration de la connexion est signalée.
const EXPIRY_WARNING_MS = 7 * 24 * 60 * 60 * 1000

async function getLinkedInState(): Promise<LinkedInState> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("linkedin_connection")
    .select("mode, target_name, expires_at, last_import_at")
    .limit(1)
    .maybeSingle()

  if (error) return { label: "LinkedIn : état indisponible", tone: "off" }
  if (!data) return { label: "Page LinkedIn non connectée", tone: "off" }
  if (data.mode === "demo") return { label: `${data.target_name} : mode démo`, tone: "warn" }
  if (!data.expires_at) return { label: `${data.target_name} connectée`, tone: "ok" }

  const expiresAt = new Date(data.expires_at)
  const remaining = expiresAt.getTime() - Date.now()
  if (remaining <= 0) return { label: `${data.target_name} : connexion expirée`, tone: "warn" }
  if (remaining < EXPIRY_WARNING_MS) {
    return { label: `${data.target_name} : expire le ${dateFormat.format(expiresAt)}`, tone: "warn" }
  }
  return { label: `${data.target_name} connectée`, tone: "ok" }
}

const DOT_CLASS: Record<LinkedInState["tone"], string> = {
  ok: "bg-success",
  warn: "bg-event-pending",
  off: "bg-sidebar-muted",
}

export async function ConnectionStatus() {
  const linkedIn = await getLinkedInState()

  return (
    <ul className="grid gap-1.5 rounded-xl bg-sidebar-accent p-3 text-xs text-sidebar-muted">
      <li>
        <Link
          href="/parametrage?onglet=linkedin"
          className="flex items-center gap-2 rounded-sm text-sidebar-foreground hover:text-sidebar-link focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
        >
          <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", DOT_CLASS[linkedIn.tone])} />
          <span className="truncate">{linkedIn.label}</span>
        </Link>
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-sidebar-muted" />
        Agenda Google : non synchronisé
      </li>
    </ul>
  )
}
