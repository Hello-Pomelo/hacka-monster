import { useId } from "react"

import { StringListInput } from "@/components/parametrage/string-list-input"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MAX_VOICE_ADJECTIVES, TARGET_FREQUENCY_OPTIONS } from "@/lib/parametrage/types"

import type { LineSectionProps } from "./line-editor"

// Limites de `lineFieldsSchema`, reprises dans la saisie pour ne jamais envoyer une liste refusée.
const MAX_TRAITS = 6
const MAX_PILLARS = 6

type FrequencyItem = { value: string; label: string }

// Une valeur en base hors de la liste (saisie avant la liste actuelle) reste affichée et choisie.
function frequencyItems(current: number): FrequencyItem[] {
  const items: FrequencyItem[] = TARGET_FREQUENCY_OPTIONS.map((option) => ({
    value: String(option.value),
    label: option.label,
  }))
  if (!items.some((item) => item.value === String(current))) {
    items.push({ value: String(current), label: `${current.toLocaleString("fr-FR")} posts par semaine` })
  }
  return items
}

// Voix et piliers de la ligne (E1, étape 3), proposés par l'IA puis modifiables champ par champ.
export function VoiceFields({ value, onChange, disabled }: LineSectionProps) {
  const id = useId()
  const items = frequencyItems(value.target_per_week)

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={`${id}-adjectives`}>
          {MAX_VOICE_ADJECTIVES} adjectifs de voix
        </FieldLabel>
        <StringListInput
          id={`${id}-adjectives`}
          value={value.voice_adjectives}
          onChange={(voice_adjectives) => onChange({ voice_adjectives })}
          placeholder="Ajouter un adjectif"
          max={MAX_VOICE_ADJECTIVES}
          maxLength={40}
          disabled={disabled}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor={`${id}-we-are`}>On est</FieldLabel>
          <StringListInput
            id={`${id}-we-are`}
            value={value.we_are}
            onChange={(we_are) => onChange({ we_are })}
            placeholder="Ajouter un trait"
            max={MAX_TRAITS}
            maxLength={120}
            disabled={disabled}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-we-are-not`}>On n&apos;est pas</FieldLabel>
          <StringListInput
            id={`${id}-we-are-not`}
            value={value.we_are_not}
            onChange={(we_are_not) => onChange({ we_are_not })}
            placeholder="Ajouter un trait"
            max={MAX_TRAITS}
            maxLength={120}
            disabled={disabled}
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor={`${id}-pillars`}>Piliers de contenu</FieldLabel>
        <FieldDescription id={`${id}-pillars-description`}>
          Les grands sujets de la ligne, {MAX_PILLARS} au plus.
        </FieldDescription>
        <StringListInput
          id={`${id}-pillars`}
          value={value.pillars}
          onChange={(pillars) => onChange({ pillars })}
          placeholder="Ajouter un pilier"
          max={MAX_PILLARS}
          maxLength={80}
          disabled={disabled}
          aria-describedby={`${id}-pillars-description`}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${id}-frequency`}>Objectif de rythme</FieldLabel>
        <FieldDescription id={`${id}-frequency-description`}>
          Défaut : 1 post par semaine. Alimente les indicateurs du calendrier.
        </FieldDescription>
        <Select
          items={items}
          value={String(value.target_per_week)}
          onValueChange={(next) => {
            if (next) onChange({ target_per_week: Number(next) })
          }}
          disabled={disabled}
        >
          <SelectTrigger
            id={`${id}-frequency`}
            aria-describedby={`${id}-frequency-description`}
            className="w-full max-w-xs pl-3 data-[size=default]:h-10"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  )
}
