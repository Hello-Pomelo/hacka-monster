"use client"

import { useState } from "react"

import { saveCharter } from "@/app/(app)/parametrage/actions"
import { SaveIndicator } from "@/components/parametrage/save-indicator"
import { StringListInput } from "@/components/parametrage/string-list-input"
import { useAutosave } from "@/components/parametrage/use-autosave"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { ADDRESS_FORM_LABELS, type Charter, type CharterFields } from "@/lib/parametrage/types"

type AddressForm = CharterFields["address_form"]

const ADDRESS_FORMS = Object.keys(ADDRESS_FORM_LABELS) as AddressForm[]

// Limites de `charterFieldsSchema`, reprises dans la saisie pour ne jamais envoyer une liste refusée.
const MAX_BANNED_EXPRESSIONS = 100
const MAX_SENSITIVE_TOPICS = 50
const MAX_ITEM_LENGTH = 120

function isAddressForm(value: unknown): value is AddressForm {
  return typeof value === "string" && (ADDRESS_FORMS as string[]).includes(value)
}

function toCharterFields(charter: Charter): CharterFields {
  return {
    banned_expressions: charter.banned_expressions,
    sensitive_topics: charter.sensitive_topics,
    address_form: isAddressForm(charter.address_form) ? charter.address_form : "vous",
    inclusive_writing: charter.inclusive_writing,
  }
}

// Règles de la charte commune (spec Paramétrage, E1 étape 4), enregistrées automatiquement.
// L'état local survit aux rafraîchissements du Server Component parent après chaque enregistrement.
export function CharterForm({ charter }: { charter: Charter }) {
  const [fields, setFields] = useState<CharterFields>(() => toCharterFields(charter))
  const { state } = useAutosave(fields, saveCharter)

  function update(patch: Partial<CharterFields>) {
    setFields((current) => ({ ...current, ...patch }))
  }

  return (
    <Card className="ring-0">
      <CardHeader>
        <CardTitle>Règles d&apos;écriture</CardTitle>
        <CardDescription>
          L&apos;IA les applique à chaque post, quelle que soit la ligne éditoriale.
        </CardDescription>
        <CardAction>
          <SaveIndicator state={state} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="charter-banned-expressions">Expressions interdites</FieldLabel>
            <FieldDescription id="charter-banned-expressions-description">
              Liste anti-clichés préremplie. Une expression interdite est signalée à chaque contrôle.
            </FieldDescription>
            <StringListInput
              id="charter-banned-expressions"
              value={fields.banned_expressions}
              onChange={(banned_expressions) => update({ banned_expressions })}
              placeholder="Ajouter une expression"
              max={MAX_BANNED_EXPRESSIONS}
              maxLength={MAX_ITEM_LENGTH}
              aria-describedby="charter-banned-expressions-description"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="charter-sensitive-topics">Sujets sensibles</FieldLabel>
            <FieldDescription id="charter-sensitive-topics-description">
              L&apos;IA a pour consigne de ne jamais aborder ces sujets.
            </FieldDescription>
            <StringListInput
              id="charter-sensitive-topics"
              value={fields.sensitive_topics}
              onChange={(sensitive_topics) => update({ sensitive_topics })}
              placeholder="Ajouter un sujet"
              max={MAX_SENSITIVE_TOPICS}
              maxLength={MAX_ITEM_LENGTH}
              aria-describedby="charter-sensitive-topics-description"
            />
          </Field>

          <FieldSet>
            <FieldLegend id="charter-address-form-legend" variant="label">
              Adresse au lecteur
            </FieldLegend>
            <RadioGroup
              value={fields.address_form}
              onValueChange={(value: unknown) => {
                if (isAddressForm(value)) update({ address_form: value })
              }}
              aria-labelledby="charter-address-form-legend"
              className="flex flex-wrap gap-6"
            >
              {ADDRESS_FORMS.map((form) => (
                <Field key={form} orientation="horizontal" className="w-auto">
                  <RadioGroupItem value={form} id={`charter-address-form-${form}`} />
                  <FieldLabel htmlFor={`charter-address-form-${form}`} className="font-normal">
                    {ADDRESS_FORM_LABELS[form]}
                  </FieldLabel>
                </Field>
              ))}
            </RadioGroup>
          </FieldSet>

          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="charter-inclusive-writing">Écriture inclusive</FieldLabel>
              <FieldDescription>
                Le texte utilise l&apos;écriture inclusive (par exemple « collaborateurs et
                collaboratrices »).
              </FieldDescription>
            </FieldContent>
            <Switch
              id="charter-inclusive-writing"
              checked={fields.inclusive_writing}
              onCheckedChange={(inclusive_writing) => update({ inclusive_writing })}
            />
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
