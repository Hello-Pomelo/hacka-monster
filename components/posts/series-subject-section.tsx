"use client"

import { useId, useState } from "react"
import { ChevronRight } from "lucide-react"

import { GuidedQuestionsFields } from "@/components/posts/guided-questions-fields"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { POST_TYPE_IDS, POST_TYPES, type PostTypeId } from "@/lib/post-types"

const SUBJECT_REQUIRED = "Décrivez le sujet de la série."

const TYPE_LABELS = Object.fromEntries(POST_TYPE_IDS.map((id) => [id, POST_TYPES[id].label]))

type SeriesSubjectSectionProps = {
  subject: string
  brief: string
  type: PostTypeId
  answers: Record<string, string>
  // Erreur renvoyée par le serveur sur le sujet.
  subjectError: string | null
  // Client non citable détecté dans la matière, ou erreur du serveur sur le brief.
  briefError: string | null
  disabled: boolean
  onSubjectChange: (subject: string) => void
  onBriefChange: (brief: string) => void
  onTypeChange: (type: PostTypeId) => void
  onAnswersChange: (answers: Record<string, string>) => void
}

// Bloc « Matière » de E2 : sujet obligatoire, brief, type de post et questions guidées du gabarit.
export function SeriesSubjectSection({
  subject,
  brief,
  type,
  answers,
  subjectError,
  briefError,
  disabled,
  onSubjectChange,
  onBriefChange,
  onTypeChange,
  onAnswersChange,
}: SeriesSubjectSectionProps) {
  const id = useId()
  const [subjectBlurred, setSubjectBlurred] = useState(false)

  const questions = POST_TYPES[type].questions
  const answeredCount = questions.filter((question) => answers[question.id]?.trim()).length
  const subjectMessage = subjectError ?? (subjectBlurred && subject.trim() === "" ? SUBJECT_REQUIRED : null)

  return (
    <Card className="gap-4 p-5 ring-0">
      <h2 className="font-heading text-lg">Matière</h2>

      <Field data-invalid={subjectMessage ? true : undefined}>
        <FieldLabel htmlFor={`${id}-subject`}>Sujet</FieldLabel>
        <Textarea
          id={`${id}-subject`}
          rows={2}
          maxLength={300}
          required
          aria-invalid={subjectMessage ? true : undefined}
          placeholder="En une phrase, de quoi voulez-vous parler ?"
          value={subject}
          onChange={(event) => onSubjectChange(event.target.value)}
          onBlur={() => setSubjectBlurred(true)}
          disabled={disabled}
        />
        <FieldError>{subjectMessage}</FieldError>
      </Field>

      <Field data-invalid={briefError ? true : undefined}>
        <FieldLabel htmlFor={`${id}-brief`}>
          Brief
          <span className="font-normal text-subtle-foreground">facultatif</span>
        </FieldLabel>
        <Textarea
          id={`${id}-brief`}
          rows={3}
          maxLength={2000}
          aria-invalid={briefError ? true : undefined}
          placeholder="Contexte, messages clés, liens utiles…"
          value={brief}
          onChange={(event) => onBriefChange(event.target.value)}
          disabled={disabled}
        />
        <FieldError>{briefError}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor={`${id}-type`}>Type de post</FieldLabel>
        <Select
          items={TYPE_LABELS}
          value={type}
          onValueChange={(value) => value && onTypeChange(value)}
          disabled={disabled}
        >
          <SelectTrigger id={`${id}-type`} className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POST_TYPE_IDS.map((typeId) => (
              <SelectItem key={typeId} value={typeId}>
                {POST_TYPES[typeId].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Collapsible>
        <CollapsibleTrigger className="group/trigger flex w-fit items-center gap-1.5 rounded-lg text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <ChevronRight
            aria-hidden
            className="size-4 text-muted-foreground transition-transform group-data-[panel-open]/trigger:rotate-90"
          />
          Questions guidées
          <span aria-hidden className="rounded-full bg-chip px-2 text-xs text-chip-foreground tabular-nums">
            {answeredCount}/{questions.length}
          </span>
          <span className="sr-only">
            , {answeredCount} réponse{answeredCount > 1 ? "s" : ""} sur {questions.length}
          </span>
        </CollapsibleTrigger>
        {/* La légende du bloc reprend le titre du déclencheur : elle reste lue par les lecteurs d'écran. */}
        <CollapsibleContent className="pt-3 [&_legend]:sr-only">
          <GuidedQuestionsFields type={type} answers={answers} onChange={onAnswersChange} disabled={disabled} />
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
