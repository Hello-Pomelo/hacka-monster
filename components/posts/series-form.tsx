"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"

import { generateSeriesPosts } from "@/app/(app)/series/actions"
import { SeriesDatesPanel } from "@/components/posts/series-dates-panel"
import { SeriesLineSection } from "@/components/posts/series-line-section"
import { SeriesScheduleSection } from "@/components/posts/series-schedule-section"
import { SeriesSettingsSection } from "@/components/posts/series-settings-section"
import { SeriesSubjectSection } from "@/components/posts/series-subject-section"
import { useSlotPrefill } from "@/components/posts/use-slot-prefill"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  callAction,
  resolveDefaultLine,
  type LineOption,
  type SeriesFormInput,
  type SeriesSummary,
} from "@/lib/creation"
import { checkGuardrails, firstBlockingMessage, type CharterRules } from "@/lib/guardrails"
import { POST_TYPE_IDS, POST_TYPES, isPostTypeId, type PostParams, type PostTypeId } from "@/lib/post-types"
import {
  SERIES_MAX_POSTS,
  defaultParamsFor,
  planSeries,
  type SchedulePlan,
  type SeriesSchedule,
  type SeriesSettings,
  type SlotTouched,
} from "@/lib/series"

type ServerError = { field: string | null; message: string }

const SCHEDULE_FIELDS = ["startDate", "endDate", "count", "time", "series"] as const

// Réponses non vides aux questions du gabarit choisi : les réponses d'un autre type restent en
// mémoire pour un retour en arrière, mais ne partent pas avec la série.
function answersFor(type: PostTypeId, answers: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const question of POST_TYPES[type].questions) {
    const answer = answers[question.id]?.trim()
    if (answer) result[question.id] = answer
  }
  return result
}

// En mode « Date de fin », le nombre de posts n'est pas lu par le serveur mais doit rester valide.
function countForInput(count: number): number {
  return Number.isInteger(count) ? Math.min(Math.max(count, 1), SERIES_MAX_POSTS) : 1
}

type SeriesFormProps = {
  series: SeriesSummary
  settings: SeriesSettings
  lines: LineOption[]
  profileLineId: string | null
  charter: CharterRules
  // Jour de Paris au rendu de la page.
  today: string
}

// E2 « Paramètres de la série » (spec Création de post E2, P0 2 et P0 3 ; spec Créneaux conseillés) :
// formulaire à gauche, panneau « Dates prévues » à droite. Générer crée un Brouillon par date prévue
// puis ouvre le premier dans E3, qui écrit les textes un par un.
export function SeriesForm({ series, settings, lines, profileLineId, charter, today }: SeriesFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [subject, setSubject] = useState(series.subject)
  const [brief, setBrief] = useState(series.brief)
  const [type, setType] = useState<PostTypeId>(isPostTypeId(series.type) ? series.type : POST_TYPE_IDS[0])
  const [answers, setAnswers] = useState(settings.answers)
  const [lineId, setLineId] = useState<string | null>(
    () =>
      (lines.find((line) => line.id === series.editorialLineId) ?? resolveDefaultLine(lines, { profileLineId }))
        ?.id ?? null
  )
  const [params, setParams] = useState<PostParams>(settings.params)
  // Tant que l'admin n'a touché à aucun réglage, ils suivent la ligne et le type choisis.
  const [paramsTouched, setParamsTouched] = useState(false)
  const [schedule, setSchedule] = useState<SeriesSchedule>(settings.schedule)
  const [slotTouched, setSlotTouched] = useState<SlotTouched>(settings.slotTouched)
  const [serverError, setServerError] = useState<ServerError | null>(null)

  const slot = useSlotPrefill({ type, setSchedule, slotTouched, setSlotTouched, today })
  const plan = useMemo(() => planSeries(schedule), [schedule])
  const typeAnswers = useMemo(() => answersFor(type, answers), [type, answers])
  // Un client non citable dans la matière bloque la génération avant tout appel à l'IA (spec
  // Paramétrage, section 5). Le serveur refait le contrôle.
  const briefBlock = useMemo(
    () =>
      firstBlockingMessage(
        checkGuardrails([subject, brief, ...Object.values(typeAnswers)].join("\n"), charter, { scope: "brief" })
      ),
    [subject, brief, typeAnswers, charter]
  )

  const lineDefaults = (id: string | null) => lines.find((line) => line.id === id)?.defaults ?? null
  // Toute modification efface l'erreur renvoyée par le serveur.
  const edited =
    <A extends unknown[]>(handler: (...args: A) => void) =>
    (...args: A) => {
      handler(...args)
      setServerError(null)
    }
  const serverMessage = (field: string) => (serverError?.field === field ? serverError.message : null)
  const scheduleErrors: SchedulePlan["errors"] = { ...plan.errors }
  for (const field of SCHEDULE_FIELDS) scheduleErrors[field] ??= serverMessage(field) ?? undefined

  const hasPlanError = Object.keys(plan.errors).length > 0 || plan.posts.length === 0
  const canGenerate = !pending && subject.trim() !== "" && !hasPlanError && !briefBlock && lineId !== null

  function handleTypeChange(next: PostTypeId) {
    if (next === type) return
    setType(next)
    slot.onTypeChange(next)
    if (!paramsTouched) setParams(defaultParamsFor(next, lineDefaults(lineId)))
  }

  function handleLineChange(next: string) {
    setLineId(next)
    if (!paramsTouched) setParams(defaultParamsFor(type, lineDefaults(next)))
  }

  function handleParamsChange(next: PostParams) {
    setParams(next)
    setParamsTouched(true)
  }

  function handleScheduleChange(patch: Partial<SeriesSchedule>, touched?: keyof SlotTouched) {
    setSchedule((current) => ({ ...current, ...patch }))
    if (touched) slot.markTouched(touched)
  }

  function handleGenerate() {
    if (!canGenerate || lineId === null) return

    const input: SeriesFormInput = {
      seriesId: series.id,
      type,
      subject: subject.trim(),
      brief: brief.trim(),
      answers: typeAnswers,
      lineId,
      params: { ...params, cta: params.cta.trim() },
      schedule: { ...schedule, count: countForInput(schedule.count) },
      slotTouched,
    }
    setServerError(null)

    startTransition(async () => {
      const result = await callAction(() => generateSeriesPosts(input))
      if (!result.ok) {
        toast.error(result.error)
        setServerError({ field: result.field ?? null, message: result.error })
        return
      }
      const firstPostId = result.data.postIds[0]
      if (!firstPostId) {
        toast.error("Aucun post n'a été créé. Vérifiez les dates prévues.")
        return
      }
      router.push(`/posts/${firstPostId}?generer=1`)
    })
  }

  return (
    <>
      <div className="grid min-w-0 gap-6">
        <SeriesSubjectSection
          subject={subject}
          brief={brief}
          type={type}
          answers={answers}
          subjectError={serverMessage("subject")}
          briefError={briefBlock ?? serverMessage("brief")}
          disabled={pending}
          onSubjectChange={edited(setSubject)}
          onBriefChange={edited(setBrief)}
          onTypeChange={edited(handleTypeChange)}
          onAnswersChange={edited(setAnswers)}
        />
        <SeriesLineSection
          lines={lines}
          lineId={lineId}
          error={serverMessage("lineId")}
          disabled={pending}
          onChange={edited(handleLineChange)}
        />
        <SeriesSettingsSection params={params} disabled={pending} onChange={edited(handleParamsChange)} />
        <SeriesScheduleSection
          type={type}
          schedule={schedule}
          errors={scheduleErrors}
          lastPlannedDay={plan.posts.at(-1)?.day ?? null}
          today={today}
          disabled={pending}
          onChange={edited(handleScheduleChange)}
          onUseRecommendedSlot={edited(slot.applyRecommendedSlot)}
        />

        <div className="flex justify-end gap-2">
          <Button variant="secondary" className="h-10 px-4" nativeButton={false} render={<Link href="/" />}>
            Annuler
          </Button>
          <Button type="button" className="h-10 gap-2 px-4" disabled={!canGenerate} onClick={handleGenerate}>
            {pending ? <Spinner aria-label="Création des posts en cours" /> : <Sparkles aria-hidden />}
            {pending ? "Création des posts…" : "Générer"}
          </Button>
        </div>
      </div>

      <SeriesDatesPanel plan={plan} />
    </>
  )
}
