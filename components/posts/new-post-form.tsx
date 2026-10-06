"use client"

import { useId, useState, useTransition, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { toast } from "sonner"

import { createManualPost } from "@/app/(app)/posts/actions"
import { createSeries } from "@/app/(app)/series/actions"
import { CreationModeCards, type CreationMode } from "@/components/posts/creation-mode-cards"
import { GuidedQuestionsFields } from "@/components/posts/guided-questions-fields"
import { PostTypeCards } from "@/components/posts/post-type-cards"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { callAction, type NewPostInput, type NewPostSearch } from "@/lib/creation"
import { POST_TYPES, type PostTypeId } from "@/lib/post-types"

const SUBJECT_REQUIRED = "Décrivez le sujet du post."

const SUBMIT_LABELS: Record<CreationMode, string> = {
  ai: "Continuer vers les paramètres",
  manual: "Écrire le post",
}

// Réponses non vides aux questions du gabarit choisi.
function answersFor(type: PostTypeId, answers: Record<string, string> | undefined): Record<string, string> {
  const result: Record<string, string> = {}
  for (const question of POST_TYPES[type].questions) {
    const answer = answers?.[question.id]?.trim()
    if (answer) result[question.id] = answer
  }
  return result
}

function OptionalMark() {
  return <span className="font-normal text-subtle-foreground">facultatif</span>
}

type NewPostFormProps = {
  prefill: NewPostSearch
  defaultLineId: string | null
}

// E1 « Nouveau post » : mode de création, type, sujet, puis brief et questions guidées en mode IA.
export function NewPostForm({ prefill, defaultLineId }: NewPostFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [mode, setMode] = useState<CreationMode>("ai")
  const [type, setType] = useState<PostTypeId | null>(prefill.type ?? null)
  const [subject, setSubject] = useState(prefill.subject ?? "")
  const [subjectError, setSubjectError] = useState<string | null>(null)
  const [brief, setBrief] = useState("")
  // Réponses gardées par type : changer de type ne mélange pas des questions différentes.
  const [answersByType, setAnswersByType] = useState<Partial<Record<PostTypeId, Record<string, string>>>>({})
  const subjectId = useId()
  const briefId = useId()

  const isAi = mode === "ai"
  const subjectMissing = isAi && subject.trim() === ""
  const canSubmit = !pending && type !== null && !subjectMissing

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit || type === null) return

    const input: NewPostInput = {
      mode,
      type,
      subject: subject.trim(),
      brief: isAi ? brief.trim() : "",
      answers: isAi ? answersFor(type, answersByType[type]) : {},
      lineId: defaultLineId,
      date: prefill.date,
      ideaId: prefill.ideaId,
      suggestionKey: prefill.suggestionKey,
    }
    setSubjectError(null)

    startTransition(async () => {
      if (isAi) {
        const result = await callAction(() => createSeries(input))
        if (result.ok) router.push(`/series/${result.data.seriesId}`)
        else showError(result)
      } else {
        const result = await callAction(() => createManualPost(input))
        if (result.ok) router.push(`/posts/${result.data.postId}`)
        else showError(result)
      }
    })
  }

  function showError({ error, field }: { error: string; field?: string }) {
    toast.error(error)
    if (field === "subject") setSubjectError(error)
  }

  function handleModeChange(next: CreationMode) {
    setMode(next)
    setSubjectError(null)
  }

  return (
    <Card className="max-w-[760px] gap-6 p-6 ring-0">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <CreationModeCards value={mode} onChange={handleModeChange} disabled={pending} />
        <PostTypeCards value={type} onChange={setType} disabled={pending} />

        <Field data-invalid={subjectError ? true : undefined}>
          <FieldLabel htmlFor={subjectId}>
            Sujet
            {!isAi && <OptionalMark />}
          </FieldLabel>
          <Textarea
            id={subjectId}
            rows={2}
            maxLength={300}
            required={isAi}
            aria-invalid={subjectError ? true : undefined}
            placeholder="En une phrase, de quoi voulez-vous parler ?"
            value={subject}
            onChange={(event) => {
              setSubject(event.target.value)
              setSubjectError(null)
            }}
            onBlur={() => {
              if (subjectMissing) setSubjectError(SUBJECT_REQUIRED)
            }}
            disabled={pending}
          />
          <FieldDescription>Une idée brute suffit.</FieldDescription>
          <FieldError>{subjectError}</FieldError>
        </Field>

        {isAi && (
          <Field>
            <FieldLabel htmlFor={briefId}>
              Brief
              <OptionalMark />
            </FieldLabel>
            <Textarea
              id={briefId}
              rows={3}
              maxLength={2000}
              placeholder="Contexte, messages clés, liens utiles…"
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              disabled={pending}
            />
          </Field>
        )}

        {isAi && type !== null && (
          <GuidedQuestionsFields
            type={type}
            answers={answersByType[type] ?? {}}
            onChange={(answers) => setAnswersByType((previous) => ({ ...previous, [type]: answers }))}
            disabled={pending}
          />
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" className="h-10 px-4" nativeButton={false} render={<Link href="/" />}>
            Annuler
          </Button>
          <Button type="submit" className="h-10 gap-2 px-4" disabled={!canSubmit}>
            {pending && <Spinner aria-label="Création en cours" />}
            {SUBMIT_LABELS[mode]}
            {!pending && <ArrowRight aria-hidden />}
          </Button>
        </div>
      </form>
    </Card>
  )
}
