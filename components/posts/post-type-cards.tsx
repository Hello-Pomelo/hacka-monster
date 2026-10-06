"use client"

import { useId } from "react"

import { ChoiceCard } from "@/components/posts/creation-mode-cards"
import { FieldLegend, FieldSet } from "@/components/ui/field"
import { RadioGroup } from "@/components/ui/radio-group"
import { POST_TYPE_IDS, POST_TYPES, isPostTypeId, type PostTypeId } from "@/lib/post-types"

type PostTypeCardsProps = {
  value: PostTypeId | null
  onChange: (value: PostTypeId) => void
  disabled?: boolean
}

// Choix du gabarit parmi les types de lib/post-types.ts. `null` : aucun type coché.
export function PostTypeCards({ value, onChange, disabled }: PostTypeCardsProps) {
  const legendId = useId()

  return (
    <FieldSet>
      <FieldLegend id={legendId} variant="label">
        Type de post
      </FieldLegend>
      <RadioGroup
        aria-labelledby={legendId}
        value={value}
        onValueChange={(next) => {
          if (typeof next === "string" && isPostTypeId(next)) onChange(next)
        }}
        disabled={disabled}
        className="grid-cols-3"
      >
        {POST_TYPE_IDS.map((id) => (
          <ChoiceCard
            key={id}
            value={id}
            title={POST_TYPES[id].label}
            description={POST_TYPES[id].description}
          />
        ))}
      </RadioGroup>
    </FieldSet>
  )
}
