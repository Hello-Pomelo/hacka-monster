"use client"

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
import { CLIENT_STATUS_LABELS, type ClientStatus } from "@/lib/parametrage/types"

const STATUS_DESCRIPTIONS: Record<ClientStatus, string> = {
  citable: "Le client peut être nommé.",
  citable_without_detail: "Le client peut être nommé, sans détail sur le projet.",
  not_citable: "Le client ne doit jamais être nommé.",
}

const STATUSES = Object.keys(STATUS_DESCRIPTIONS) as ClientStatus[]

const CHOICE_CARD =
  "border-input has-[>[data-slot=field]]:rounded-xl has-data-checked:border-primary has-data-checked:bg-tag *:data-[slot=field]:p-3"

function isClientStatus(value: unknown): value is ClientStatus {
  return typeof value === "string" && (STATUSES as string[]).includes(value)
}

type ClientStatusFieldProps = {
  idPrefix: string
  value: ClientStatus
  onChange: (status: ClientStatus) => void
  disabled: boolean
}

// Statut d'un client de la charte (spec Paramétrage, US4) : une carte de choix par statut.
export function ClientStatusField({ idPrefix, value, onChange, disabled }: ClientStatusFieldProps) {
  return (
    <FieldSet>
      <FieldLegend id={`${idPrefix}-status-legend`} variant="label">
        Statut
      </FieldLegend>
      <RadioGroup
        value={value}
        onValueChange={(next: unknown) => {
          if (isClientStatus(next)) onChange(next)
        }}
        aria-labelledby={`${idPrefix}-status-legend`}
        disabled={disabled}
      >
        {STATUSES.map((status) => (
          <FieldLabel key={status} htmlFor={`${idPrefix}-status-${status}`} className={CHOICE_CARD}>
            <Field orientation="horizontal">
              <RadioGroupItem value={status} id={`${idPrefix}-status-${status}`} />
              <FieldContent>
                <FieldTitle>{CLIENT_STATUS_LABELS[status]}</FieldTitle>
                <FieldDescription>{STATUS_DESCRIPTIONS[status]}</FieldDescription>
              </FieldContent>
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
    </FieldSet>
  )
}
