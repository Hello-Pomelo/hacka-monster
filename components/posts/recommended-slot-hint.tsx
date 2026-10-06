"use client"

import { Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { PostTypeId } from "@/lib/post-types"
import { RECOMMENDED_SLOT_TOOLTIP, recommendedSlotSentence, slotMatches } from "@/lib/recommended-slots"
import type { Weekday } from "@/lib/series"

type RecommendedSlotHintProps = {
  type: PostTypeId
  weekday: Weekday
  time: string
  onUse: () => void
}

// Ligne d'information sous le jour et l'heure (spec Créneaux conseillés, P0 2) : créneau conseillé
// et sa raison, toujours visibles. Le lien n'apparaît que si les valeurs diffèrent de la matrice.
export function RecommendedSlotHint({ type, weekday, time, onUse }: RecommendedSlotHintProps) {
  const matches = slotMatches(type, weekday, time)

  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-subtle-foreground">
      <Tooltip>
        <TooltipTrigger
          aria-label="Origine des créneaux conseillés"
          className="inline-flex shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Info aria-hidden className="size-4" />
        </TooltipTrigger>
        <TooltipContent>{RECOMMENDED_SLOT_TOOLTIP}</TooltipContent>
      </Tooltip>
      <span>{recommendedSlotSentence(type, matches)}</span>
      {!matches && (
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-[13px] text-link"
          onClick={onUse}
        >
          Utiliser ce créneau
        </Button>
      )}
    </p>
  )
}
