import { useId } from "react"

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { LENGTH_IDS, LENGTH_LABELS, TONE_IDS, TONE_LABELS, type PostParams } from "@/lib/post-types"

import type { LineSectionProps } from "./line-editor"

// Longueur maximale de l'appel à l'action dans `postParamsSchema`.
const MAX_CTA_LENGTH = 200

const SELECT_TRIGGER_CLASS = "w-full pl-3 data-[size=default]:h-10"

// Réglages par défaut d'un post de la ligne (E1, étape 3) : ton, longueur, emojis, hashtags, appel à l'action.
export function DefaultsFields({ value, onChange, disabled }: LineSectionProps) {
  const id = useId()
  const defaults = value.defaults

  function update(patch: Partial<PostParams>) {
    onChange({ defaults: { ...defaults, ...patch } })
  }

  return (
    <FieldGroup>
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor={`${id}-tone`}>Ton</FieldLabel>
          <Select
            items={TONE_LABELS}
            value={defaults.tone}
            onValueChange={(tone) => {
              if (tone) update({ tone })
            }}
            disabled={disabled}
          >
            <SelectTrigger id={`${id}-tone`} className={SELECT_TRIGGER_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TONE_IDS.map((tone) => (
                <SelectItem key={tone} value={tone}>
                  {TONE_LABELS[tone]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-length`}>Longueur</FieldLabel>
          <Select
            items={LENGTH_LABELS}
            value={defaults.length}
            onValueChange={(length) => {
              if (length) update({ length })
            }}
            disabled={disabled}
          >
            <SelectTrigger id={`${id}-length`} className={SELECT_TRIGGER_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LENGTH_IDS.map((length) => (
                <SelectItem key={length} value={length}>
                  {LENGTH_LABELS[length]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-4">
        <Field orientation="horizontal" className="w-auto">
          <Switch
            id={`${id}-emojis`}
            checked={defaults.emojis}
            onCheckedChange={(emojis) => update({ emojis })}
            disabled={disabled}
          />
          <FieldLabel htmlFor={`${id}-emojis`}>Emojis</FieldLabel>
        </Field>
        <Field orientation="horizontal" className="w-auto">
          <Switch
            id={`${id}-hashtags`}
            checked={defaults.hashtags}
            onCheckedChange={(hashtags) => update({ hashtags })}
            disabled={disabled}
          />
          <FieldLabel htmlFor={`${id}-hashtags`}>Hashtags</FieldLabel>
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor={`${id}-cta`}>Appel à l&apos;action</FieldLabel>
        <Input
          id={`${id}-cta`}
          value={defaults.cta}
          onChange={(event) => update({ cta: event.target.value })}
          placeholder="Laisser vide : l'IA choisit un appel adapté au type de post."
          maxLength={MAX_CTA_LENGTH}
          disabled={disabled}
          className="h-10 px-3"
        />
      </Field>
    </FieldGroup>
  )
}
