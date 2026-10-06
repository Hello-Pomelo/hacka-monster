"use client"

import { useId } from "react"

import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { POST_TYPES, type PostTypeId } from "@/lib/post-types"

type GuidedQuestionsFieldsProps = {
  type: PostTypeId
  answers: Record<string, string>
  onChange: (answers: Record<string, string>) => void
  disabled?: boolean
}

// Questions guidées du gabarit choisi (spec Paramétrage, D21). Réponses facultatives, en vrac.
export function GuidedQuestionsFields({ type, answers, onChange, disabled }: GuidedQuestionsFieldsProps) {
  const id = useId()

  return (
    <FieldSet disabled={disabled}>
      <FieldLegend>Questions guidées</FieldLegend>
      <FieldDescription>Facultatives. Notes, phrases incomplètes ou fautes : l&apos;IA met en forme.</FieldDescription>
      {POST_TYPES[type].questions.map((question) => {
        const fieldId = `${id}-${question.id}`
        return (
          <Field key={question.id}>
            <FieldLabel htmlFor={fieldId}>{question.label}</FieldLabel>
            <Textarea
              id={fieldId}
              rows={2}
              maxLength={2000}
              placeholder={question.placeholder}
              value={answers[question.id] ?? ""}
              onChange={(event) => onChange({ ...answers, [question.id]: event.target.value })}
              disabled={disabled}
            />
          </Field>
        )
      })}
    </FieldSet>
  )
}
