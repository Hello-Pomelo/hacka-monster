import { useId } from "react"

import { StringListInput } from "@/components/parametrage/string-list-input"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MAX_CORE_VALUES } from "@/lib/parametrage/types"

import type { LineSectionProps } from "./line-editor"

// Limites de `lineFieldsSchema`, reprises dans la saisie pour ne jamais envoyer un champ refusé.
const MAX_BRAND_LENGTH = 120
const MAX_ABOUT_LENGTH = 1500
const MAX_VALUE_LENGTH = 60
const MAX_TARGETS_LENGTH = 500

// Identité de la ligne (E1, étape 1) : marque, « qui sommes-nous », valeurs, cibles.
export function IdentityFields({ value, onChange, disabled }: LineSectionProps) {
  const id = useId()

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={`${id}-brand`}>Nom de la marque</FieldLabel>
        <Input
          id={`${id}-brand`}
          value={value.brand}
          onChange={(event) => onChange({ brand: event.target.value })}
          maxLength={MAX_BRAND_LENGTH}
          disabled={disabled}
          className="h-10 px-3"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${id}-about`}>Qui sommes-nous</FieldLabel>
        <Textarea
          id={`${id}-about`}
          rows={4}
          value={value.about}
          onChange={(event) => onChange({ about: event.target.value })}
          placeholder="En deux ou trois phrases : ce que fait l'entreprise, pour qui, comment."
          maxLength={MAX_ABOUT_LENGTH}
          disabled={disabled}
          className="min-h-24"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${id}-values`}>Valeurs</FieldLabel>
        <FieldDescription id={`${id}-values-description`}>
          {MAX_CORE_VALUES} valeurs au plus.
        </FieldDescription>
        <StringListInput
          id={`${id}-values`}
          value={value.core_values}
          onChange={(core_values) => onChange({ core_values })}
          placeholder="Ajouter une valeur"
          max={MAX_CORE_VALUES}
          maxLength={MAX_VALUE_LENGTH}
          disabled={disabled}
          aria-describedby={`${id}-values-description`}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${id}-targets`}>Cibles</FieldLabel>
        <Textarea
          id={`${id}-targets`}
          rows={2}
          value={value.targets}
          onChange={(event) => onChange({ targets: event.target.value })}
          placeholder="Candidats data, clients de la distribution…"
          maxLength={MAX_TARGETS_LENGTH}
          disabled={disabled}
        />
      </Field>
    </FieldGroup>
  )
}
