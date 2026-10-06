"use client"

import { useState } from "react"
import { CalendarDays } from "lucide-react"
import { fr } from "react-day-picker/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { dayKeySchema } from "@/lib/series"

const pad = (value: number) => String(value).padStart(2, "0")

// Le calendrier manipule des dates locales : seuls l'année, le mois et le jour comptent.
function dayToLocalDate(day: string): Date {
  const [year, month, date] = day.split("-").map(Number)
  return new Date(year, month - 1, date)
}

function localDateToDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const dayLabelFormat = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

// « Jeudi 8 octobre 2026 »
function formatDayLabel(day: string): string {
  const [year, month, date] = day.split("-").map(Number)
  const label = dayLabelFormat.format(new Date(Date.UTC(year, month - 1, date, 12)))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

type SeriesDatePickerProps = {
  id: string
  // Jour de Paris « YYYY-MM-DD », ou null tant qu'aucune date n'est choisie.
  value: string | null
  onChange: (day: string) => void
  // Premier jour sélectionnable.
  minDay: string
  invalid?: boolean
  disabled?: boolean
}

// Champ date du formulaire de série : bouton qui ouvre un calendrier en français.
export function SeriesDatePicker({ id, value, onChange, minDay, invalid, disabled }: SeriesDatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = value && dayKeySchema.safeParse(value).success ? dayToLocalDate(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            id={id}
            variant="outline"
            aria-invalid={invalid ? true : undefined}
            className="h-10 w-full justify-start gap-2 px-3 font-normal"
          />
        }
      >
        <CalendarDays aria-hidden className="text-muted-foreground" />
        {selected && value ? (
          formatDayLabel(value)
        ) : (
          <span className="text-muted-foreground">Choisir une date</span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          required
          locale={fr}
          selected={selected}
          defaultMonth={selected ?? dayToLocalDate(minDay)}
          disabled={{ before: dayToLocalDate(minDay) }}
          onSelect={(date) => {
            onChange(localDateToDay(date))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
