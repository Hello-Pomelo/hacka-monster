"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { buttonVariants } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { addMonths, formatMonth, homeHref, monthOf, type HomeView, type LineFilter } from "@/lib/calendar"
import { cn } from "@/lib/utils"

const LINE_OPTIONS: { id: LineFilter; label: string }[] = [
  { id: "toutes", label: "Toutes" },
  { id: "marketing", label: "Marketing" },
  { id: "rh", label: "RH" },
]

type CalendarToolbarProps = {
  view: HomeView
  today: string
}

// Barre d'outils du calendrier : navigation par mois, filtre par ligne, sources affichées.
export function CalendarToolbar({ view, today }: CalendarToolbarProps) {
  const router = useRouter()

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="flex items-center gap-2">
        <Link
          href={homeHref(view, { month: addMonths(view.month, -1), day: null })}
          scroll={false}
          aria-label="Mois précédent"
          className={buttonVariants({ variant: "secondary", size: "icon" })}
        >
          <ChevronLeft aria-hidden />
        </Link>
        <Link
          href={homeHref(view, { month: addMonths(view.month, 1), day: null })}
          scroll={false}
          aria-label="Mois suivant"
          className={buttonVariants({ variant: "secondary", size: "icon" })}
        >
          <ChevronRight aria-hidden />
        </Link>
        <h2 aria-live="polite" className="min-w-[170px] font-heading text-2xl first-letter:uppercase">
          {formatMonth(view.month)}
        </h2>
        <Link
          href={homeHref(view, { month: monthOf(today), day: today })}
          scroll={false}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Aujourd&apos;hui
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <nav aria-label="Filtrer par ligne éditoriale" className="inline-flex gap-0.5 rounded-lg bg-chip p-[3px]">
          {LINE_OPTIONS.map(({ id, label }) => {
            const isActive = view.line === id
            return (
              <Link
                key={id}
                href={homeHref(view, { line: id })}
                scroll={false}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "inline-flex h-7 items-center rounded-md px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground",
                  isActive && "bg-card text-foreground ring-1 ring-border ring-inset"
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <label className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
          <Switch
            checked={view.showSuggestions}
            onCheckedChange={(checked) =>
              router.push(homeHref(view, { showSuggestions: checked }), { scroll: false })
            }
          />
          Suggestions
        </label>

        <span title="Bientôt disponible" className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
          <Switch disabled aria-label="Agenda Google, bientôt disponible" />
          Agenda Google
          <span className="rounded-full bg-chip px-1.5 text-[11px] text-chip-foreground">Bientôt</span>
        </span>
      </div>
    </div>
  )
}
