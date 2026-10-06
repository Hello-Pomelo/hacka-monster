"use client"

import { createContext, use, useOptimistic, useTransition, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { LineFilter } from "@/lib/calendar"
import { PERIOD_IDS, PERIODS, type StatsFilters } from "@/lib/stats/filters"
import { cn } from "@/lib/utils"

const LINE_OPTIONS: { id: LineFilter; label: string }[] = [
  { id: "toutes", label: "Toutes" },
  { id: "marketing", label: "Marketing" },
  { id: "rh", label: "RH" },
]

// Sélecteur segmenté du calendrier (.seg de la maquette) appliqué au ToggleGroup shadcn.
// Bordure du segment actif en ombre interne : l'anneau de focus (ring) reste visible au clavier.
const segmentClass = "gap-0.5 rounded-lg bg-chip p-[3px]"
const segmentItemClass =
  "h-7 rounded-md px-2.5 text-[13px] text-muted-foreground hover:bg-transparent hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-[inset_0_0_0_1px_var(--color-border)]"

const FiltersContext = createContext<((next: Partial<StatsFilters>) => void) | null>(null)

// Filtres en une ligne au-dessus de tout le contenu, qu'ils pilotent via l'URL.
// L'état optimiste suit les clics tout de suite ; pendant le rechargement, le contenu
// précédent reste affiché, atténué, sans saut de mise en page.
export function StatsShell({ filters, children }: { filters: StatsFilters; children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useOptimistic(filters)

  function applyFilters(next: Partial<StatsFilters>) {
    const merged = { ...optimistic, ...next }
    startTransition(() => {
      setOptimistic(merged)
      router.replace(`${pathname}?${new URLSearchParams(merged)}`, { scroll: false })
    })
  }

  return (
    <FiltersContext value={applyFilters}>
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          aria-label="Période"
          className={segmentClass}
          value={[optimistic.periode]}
          // Un clic sur l'option active la désélectionne (tableau vide) : on garde le filtre courant.
          onValueChange={(value: string[]) => {
            const periode = PERIOD_IDS.find((id) => id === value[0])
            if (periode) applyFilters({ periode })
          }}
        >
          {PERIOD_IDS.map((id) => (
            <ToggleGroupItem key={id} value={id} className={segmentItemClass}>
              {PERIODS[id].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup
          aria-label="Ligne éditoriale"
          className={segmentClass}
          value={[optimistic.ligne]}
          onValueChange={(value: string[]) => {
            const ligne = LINE_OPTIONS.find(({ id }) => id === value[0])?.id
            if (ligne) applyFilters({ ligne })
          }}
        >
          {LINE_OPTIONS.map(({ id, label }) => (
            <ToggleGroupItem key={id} value={id} className={segmentItemClass}>
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div
        aria-busy={isPending}
        className={cn("grid min-w-0 gap-6 transition-opacity", isPending && "opacity-60")}
      >
        {children}
      </div>
    </FiltersContext>
  )
}

// Bouton qui change un filtre depuis le contenu (état vide), dans la même transition que la barre.
export function FilterButton({
  filters,
  children,
}: {
  filters: Partial<StatsFilters>
  children: ReactNode
}) {
  const applyFilters = use(FiltersContext)
  if (!applyFilters) return null
  return (
    <Button variant="secondary" className="h-10 px-4" onClick={() => applyFilters(filters)}>
      {children}
    </Button>
  )
}
