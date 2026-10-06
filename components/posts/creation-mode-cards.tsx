"use client"

import { useId } from "react"

import { FieldLegend, FieldSet } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export type CreationMode = "ai" | "manual"

const MODES: { value: CreationMode; title: string; description: string }[] = [
  {
    value: "ai",
    title: "Générer avec l'IA",
    description: "Une série de 1 à 20 posts, rédigés dans le ton de votre ligne éditoriale.",
  },
  {
    value: "manual",
    title: "Écrire moi-même",
    description: "Un seul post, sans IA. Il suit le même circuit de programmation.",
  },
]

function isCreationMode(value: unknown): value is CreationMode {
  return value === "ai" || value === "manual"
}

type ChoiceCardProps = {
  value: string
  title: string
  description: string
}

// Carte de choix de la maquette « Paramétrer votre post » : bordure et fond rose une fois cochée.
export function ChoiceCard({ value, title, description }: ChoiceCardProps) {
  return (
    <label className="grid cursor-pointer grid-cols-[auto_1fr] items-start gap-x-2.5 gap-y-1 rounded-xl border border-input p-3 transition-colors has-data-checked:border-primary has-data-checked:bg-tag has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50">
      <RadioGroupItem value={value} className="mt-0.5" />
      <span className="font-medium">{title}</span>
      <span className="col-start-2 text-xs leading-snug text-subtle-foreground">{description}</span>
    </label>
  )
}

type CreationModeCardsProps = {
  value: CreationMode
  onChange: (value: CreationMode) => void
  disabled?: boolean
}

// E1 : génération d'une série par l'IA, ou un post écrit à la main (spec Création de post, P0 10).
export function CreationModeCards({ value, onChange, disabled }: CreationModeCardsProps) {
  const legendId = useId()

  return (
    <FieldSet>
      <FieldLegend id={legendId} variant="label">
        Comment voulez-vous créer ce post ?
      </FieldLegend>
      <RadioGroup
        aria-labelledby={legendId}
        value={value}
        onValueChange={(next) => {
          if (isCreationMode(next)) onChange(next)
        }}
        disabled={disabled}
        className="grid-cols-2"
      >
        {MODES.map((mode) => (
          <ChoiceCard key={mode.value} {...mode} />
        ))}
      </RadioGroup>
    </FieldSet>
  )
}
