import Link from "next/link"

import { SETTINGS_CONNECTION_HREF } from "@/lib/calendar"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

// `detail` : seconde ligne, sous le libellé (action ou date d'expiration).
type LinkedInState = { label: string; detail: string | null; tone: "ok" | "warn" | "off" }

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Paris",
})

// Délai sous lequel l'expiration de la connexion est signalée.
const EXPIRY_WARNING_MS = 7 * 24 * 60 * 60 * 1000

// Connexion unique de la page (contrat 4) : colonnes listées, jamais le jeton chiffré.
async function getLinkedInState(): Promise<LinkedInState> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("linkedin_connection")
    .select("mode, target_name, expires_at")
    .eq("id", 1)
    .maybeSingle()

  if (error) return { label: "LinkedIn : état indisponible", detail: null, tone: "off" }
  if (!data) return { label: "Page LinkedIn non connectée", detail: "Connecter la page", tone: "off" }
  if (data.mode === "demo") return { label: `${data.target_name} : mode démo`, detail: null, tone: "warn" }

  const label = `${data.target_name} connectée`
  if (!data.expires_at) return { label, detail: null, tone: "ok" }

  const expiresAt = new Date(data.expires_at)
  const remaining = expiresAt.getTime() - Date.now()
  if (remaining <= 0) return { label: `${data.target_name} : connexion expirée`, detail: null, tone: "warn" }
  return {
    label,
    detail: `Expire le ${dateFormat.format(expiresAt)}`,
    tone: remaining < EXPIRY_WARNING_MS ? "warn" : "ok",
  }
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
          href={SETTINGS_CONNECTION_HREF}
          className="group/connection grid gap-0.5 rounded-sm text-sidebar-foreground hover:text-sidebar-link focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
        >
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", DOT_CLASS[linkedIn.tone])} />
            <span className="truncate">{linkedIn.label}</span>
          </span>
          {linkedIn.detail && (
            <span className="truncate pl-3.5 text-sidebar-muted group-hover/connection:text-sidebar-link">
              {linkedIn.detail}
            </span>
          )}
        </Link>
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-sidebar-muted" />
        Agenda Google : non synchronisé
      </li>
    </ul>
  )
}
