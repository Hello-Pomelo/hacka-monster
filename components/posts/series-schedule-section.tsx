"use client"

import { useId, useSyncExternalStore } from "react"

import { RecommendedSlotHint } from "@/components/posts/recommended-slot-hint"
import { SeriesPeriodFields } from "@/components/posts/series-period-fields"
import { Card } from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PostTypeId } from "@/lib/post-types"
import {
  FREQUENCY_IDS,
  FREQUENCY_LABELS,
  WEEKDAY_IDS,
  WEEKDAY_LABELS,
  dayKeySchema,
  localTimeMention,
  weekdayOf,
  type SchedulePlan,
  type SeriesSchedule,
  type SlotTouched,
} from "@/lib/series"

const WEEKDAY_ITEMS = WEEKDAY_IDS.map((id) => ({
  value: id,
  label: WEEKDAY_LABELS[id].charAt(0).toUpperCase() + WEEKDAY_LABELS[id].slice(1),
}))

const subscribeNever = () => () => {}

// Mention de l'heure locale, calculée dans le navigateur seulement : le rendu serveur n'en a pas.
function useLocalTimeMention(day: string, time: string): string | null {
  return useSyncExternalStore(subscribeNever, () => localTimeMention(day, time), () => null)
}

type SeriesScheduleSectionProps = {
  type: PostTypeId
  schedule: SeriesSchedule
  errors: SchedulePlan["errors"]
  lastPlannedDay: string | null
  today: string
  disabled: boolean
  onChange: (patch: Partial<SeriesSchedule>, touched?: keyof SlotTouched) => void
  onUseRecommendedSlot: () => void
}

// Bloc « Publication » de E2 : rythme, heure de Paris et période de la série (spec Création de
// post P0 2, spec Créneaux conseillés P0 1 à 3). Un seul post masque la fréquence, le jour et la fin.
export function SeriesScheduleSection({
  type,
  schedule,
  errors,
  lastPlannedDay,
  today,
  disabled,
  onChange,
  onUseRecommendedSlot,
}: SeriesScheduleSectionProps) {
  const id = useId()
  const mention = useLocalTimeMention(schedule.startDate, schedule.time)

  const isSingle = schedule.endMode === "count" && schedule.count === 1
  const showWeekday = !isSingle && schedule.frequency !== "workdays"
  // Un post seul part à la date de début : son jour est celui de cette date.
  const hintWeekday =
    isSingle && dayKeySchema.safeParse(schedule.startDate).success
      ? weekdayOf(schedule.startDate)
      : schedule.weekday

  return (
    <Card className="gap-4 p-5 ring-0">
      <h2 className="font-heading text-lg">Publication</h2>

      <div className="grid grid-cols-3 items-start gap-4">
        {!isSingle && (
          <Field>
            <FieldLabel htmlFor={`${id}-frequency`}>Fréquence</FieldLabel>
            <Select
              items={FREQUENCY_LABELS}
              value={schedule.frequency}
              onValueChange={(value) => value && onChange({ frequency: value })}
              disabled={disabled}
            >
              <SelectTrigger id={`${id}-frequency`} className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_IDS.map((frequency) => (
                  <SelectItem key={frequency} value={frequency}>
                    {FREQUENCY_LABELS[frequency]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        {showWeekday && (
          <Field>
            <FieldLabel htmlFor={`${id}-weekday`}>Jour</FieldLabel>
            <Select
              items={WEEKDAY_ITEMS}
              value={schedule.weekday}
              onValueChange={(value) => value && onChange({ weekday: value }, "weekday")}
              disabled={disabled}
            >
              <SelectTrigger id={`${id}-weekday`} className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAY_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        <Field data-invalid={errors.time ? true : undefined}>
          <FieldLabel htmlFor={`${id}-time`}>Heure (Paris)</FieldLabel>
          <Input
            id={`${id}-time`}
            type="time"
            step={300}
            required
            className="h-10"
            aria-invalid={errors.time ? true : undefined}
            value={schedule.time}
            onChange={(event) => onChange({ time: event.target.value }, "time")}
            disabled={disabled}
          />
          {mention && <p className="text-xs text-subtle-foreground">{mention}</p>}
          <FieldError>{errors.time}</FieldError>
        </Field>
      </div>

      <RecommendedSlotHint type={type} weekday={hintWeekday} time={schedule.time} onUse={onUseRecommendedSlot} />

      <SeriesPeriodFields
        schedule={schedule}
        errors={errors}
        isSingle={isSingle}
        lastPlannedDay={lastPlannedDay}
        today={today}
        disabled={disabled}
        onChange={onChange}
      />
    </Card>
  )
}
