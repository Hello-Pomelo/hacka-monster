import { useId } from "react"
import { toast } from "sonner"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { STARTER_STYLES, type StarterStyle } from "@/lib/parametrage/presets"
import type { LineFields } from "@/lib/parametrage/types"

const CHOICE_CARD_CLASS =
  "rounded-xl border-input has-[>[data-slot=field]]:rounded-xl has-[>[data-slot=field]]:bg-card has-data-checked:border-primary has-data-checked:bg-tag *:data-[slot=field]:p-3"

function stylePatch(style: StarterStyle): Partial<LineFields> {
  return {
    reference_posts: [style.examplePost],
    voice_adjectives: style.voice_adjectives,
    we_are: style.we_are,
    we_are_not: style.we_are_not,
    defaults: style.defaults,
  }
}

type StarterStylePickerProps = {
  onChange: (patch: Partial<LineFields>) => void
  disabled: boolean
}

// Style de départ (E1, étape 2), proposé sans post importé ni collé : son exemple devient le post
// de référence, et sa voix et ses réglages préremplissent la ligne.
export function StarterStylePicker({ onChange, disabled }: StarterStylePickerProps) {
  const id = useId()

  function choose(value: unknown) {
    const style = STARTER_STYLES.find((item) => item.id === value)
    if (!style) return
    onChange(stylePatch(style))
    toast.success(`Style ${style.label} appliqué : ajustez la voix et les réglages si besoin.`)
  }

  return (
    <FieldSet>
      <FieldLegend id={`${id}-legend`} variant="label">
        Ou partez d&apos;un style
      </FieldLegend>
      <FieldDescription>
        Le style donne un exemple de post à l&apos;IA et préremplit la voix et les réglages par défaut.
      </FieldDescription>
      <RadioGroup
        onValueChange={choose}
        disabled={disabled}
        aria-labelledby={`${id}-legend`}
        className="grid-cols-3 gap-3"
      >
        {STARTER_STYLES.map((style) => (
          <FieldLabel key={style.id} htmlFor={`${id}-${style.id}`} className={CHOICE_CARD_CLASS}>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>{style.label}</FieldTitle>
                <FieldDescription className="text-xs text-subtle-foreground">
                  {style.description}
                </FieldDescription>
              </FieldContent>
              <RadioGroupItem value={style.id} id={`${id}-${style.id}`} />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
    </FieldSet>
  )
}
