"use client"

import { useId } from "react"

import { SeriesDatePicker } from "@/components/posts/series-date-picker"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SERIES_MAX_POSTS, type SchedulePlan, type SeriesSchedule, type SlotTouched } from "@/lib/series"

const END_MODES = ["count", "endDate"] as const satisfies readonly SeriesSchedule["endMode"][]

const TOGGLE_ITEM_CLASS =
  "px-3 aria-pressed:border-primary aria-pressed:bg-tag aria-pressed:text-tag-foreground"

const invalid = (message: string | undefined) => (message ? true : undefined)

type SeriesPeriodFieldsProps = {
  schedule: SeriesSchedule
  errors: SchedulePlan["errors"]
  // Un seul post : le choix entre nombre de posts et date de fin est masqué.
  isSingle: boolean
  // Dernière date prévue : date de fin proposée au passage en mode « Date de fin ».
  lastPlannedDay: string | null
  today: string
  disabled: boolean
  onChange: (patch: Partial<SeriesSchedule>, touched?: keyof SlotTouched) => void
}

// Période de la série : date de début, puis nombre de posts ou date de fin.
export function SeriesPeriodFields({
  schedule,
  errors,
  isSingle,
  lastPlannedDay,
  today,
  disabled,
  onChange,
}: SeriesPeriodFieldsProps) {
  const id = useId()
  const endError = schedule.endMode === "count" ? (errors.count ?? errors.series) : (errors.endDate ?? errors.series)
  const endMinDay = schedule.startDate > today ? schedule.startDate : today

  function handleEndModeChange(value: string[]) {
    const next = END_MODES.find((mode) => mode === value[0])
    if (!next || next === schedule.endMode) return
    if (next === "endDate") {
      onChange({ endMode: next, endDate: schedule.endDate ?? lastPlannedDay ?? schedule.startDate })
    } else {
      onChange({ endMode: next })
    }
  }

  return (
    <>
      {!isSingle && (
        <ToggleGroup
          aria-label="Fin de la série"
          variant="outline"
          value={[schedule.endMode]}
          onValueChange={handleEndModeChange}
          disabled={disabled}
        >
          <ToggleGroupItem value="count" className={TOGGLE_ITEM_CLASS}>
            Nombre de posts
          </ToggleGroupItem>
          <ToggleGroupItem value="endDate" className={TOGGLE_ITEM_CLASS}>
            Date de fin
          </ToggleGroupItem>
        </ToggleGroup>
      )}

      <div className="grid grid-cols-2 items-start gap-4">
        <Field data-invalid={invalid(errors.startDate)}>
          <FieldLabel htmlFor={`${id}-start`}>Date de début</FieldLabel>
          <SeriesDatePicker
            id={`${id}-start`}
            value={schedule.startDate}
            minDay={today}
            onChange={(day) => onChange({ startDate: day }, "startDate")}
            invalid={Boolean(errors.startDate)}
            disabled={disabled}
          />
          <FieldError>{errors.startDate}</FieldError>
        </Field>

        <Field data-invalid={invalid(endError)}>
          {schedule.endMode === "count" ? (
            <>
              <FieldLabel htmlFor={`${id}-count`}>Nombre de posts</FieldLabel>
              <Input
                id={`${id}-count`}
                type="number"
                inputMode="numeric"
                min={1}
                max={SERIES_MAX_POSTS}
                step={1}
                required
                className="h-10"
                aria-invalid={invalid(endError)}
                value={Number.isFinite(schedule.count) ? String(schedule.count) : ""}
                onChange={(event) =>
                  onChange({ count: event.target.value === "" ? Number.NaN : Number(event.target.value) })
                }
                disabled={disabled}
              />
            </>
          ) : (
            <>
              <FieldLabel htmlFor={`${id}-end`}>Date de fin</FieldLabel>
              <SeriesDatePicker
                id={`${id}-end`}
                value={schedule.endDate}
                minDay={endMinDay}
                onChange={(day) => onChange({ endDate: day })}
                invalid={Boolean(endError)}
                disabled={disabled}
              />
            </>
          )}
          <FieldError>{endError}</FieldError>
        </Field>
      </div>
    </>
  )
}
