"use client"

import { useOptimistic, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { PostListFilters } from "@/lib/creation-data"
import {
  LIST_LINE_IDS,
  LIST_LINE_LABELS,
  LIST_STATUS_IDS,
  listLineSchema,
  listStatusSchema,
  parsePostListSearch,
  postsHref,
} from "@/lib/post-list"
import { STATUS_LABELS } from "@/lib/posts"

// Valeur du Select pour « tous les statuts » : absente de l'URL.
const ALL_STATUSES = "tous"

const STATUS_ITEMS: Record<string, string> = {
  [ALL_STATUSES]: "Tous (hors archivés)",
  ...Object.fromEntries(LIST_STATUS_IDS.map((id) => [id, STATUS_LABELS[id]])),
}

// Filtres de la liste « Tous les posts » : statut et ligne éditoriale, portés par l'URL.
export function PostsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = parsePostListSearch({
    statut: searchParams.get("statut") ?? undefined,
    ligne: searchParams.get("ligne") ?? undefined,
  })
  // Les contrôles changent tout de suite ; la liste suit quand la page est relue.
  const [filters, setOptimisticFilters] = useOptimistic(current)
  const [isPending, startTransition] = useTransition()

  function apply(next: PostListFilters) {
    startTransition(() => {
      setOptimisticFilters(next)
      router.replace(postsHref(next), { scroll: false })
    })
  }

  return (
    <div
      data-pending={isPending ? "" : undefined}
      className="flex flex-wrap items-center gap-x-6 gap-y-3"
    >
      <div className="flex items-center gap-2">
        <span id="posts-filter-status" className="text-[13px] text-muted-foreground">
          Statut
        </span>
        <Select
          items={STATUS_ITEMS}
          value={filters.status ?? ALL_STATUSES}
          onValueChange={(value) => apply({ ...filters, status: listStatusSchema.parse(value) })}
        >
          <SelectTrigger aria-labelledby="posts-filter-status" className="min-w-[200px] bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>{STATUS_ITEMS[ALL_STATUSES]}</SelectItem>
            {LIST_STATUS_IDS.map((id) => (
              <SelectItem key={id} value={id}>
                {STATUS_LABELS[id]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span id="posts-filter-line" className="text-[13px] text-muted-foreground">
          Ligne
        </span>
        <ToggleGroup
          aria-labelledby="posts-filter-line"
          spacing={0.5}
          value={[filters.line]}
          onValueChange={(values) => {
            // Un clic sur la ligne déjà choisie la désélectionne : le filtre reste inchangé.
            if (values.length === 0) return
            apply({ ...filters, line: listLineSchema.parse(values[values.length - 1]) })
          }}
          className="rounded-lg bg-chip p-0.5"
        >
          {LIST_LINE_IDS.map((id) => (
            <ToggleGroupItem
              key={id}
              value={id}
              className="h-7 px-2.5 text-[13px] text-muted-foreground hover:bg-transparent hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:ring-1 aria-pressed:ring-border aria-pressed:ring-inset"
            >
              {LIST_LINE_LABELS[id]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {isPending && <Spinner aria-label="Mise à jour de la liste" className="text-subtle-foreground" />}
    </div>
  )
}
