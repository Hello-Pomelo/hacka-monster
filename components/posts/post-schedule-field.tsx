"use client"

import { useState, useSyncExternalStore } from "react"
import { CalendarDays, X } from "lucide-react"
import { fr } from "react-day-picker/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  isoToParis,
  localTimeMention,
  parisDateTimeToIso,
  timeSchema,
  todayInParis,
} from "@/lib/series"

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

const noSubscription = () => () => {}

type PostScheduleFieldProps = {
  // Date enregistrée (ISO UTC), ou null pour un post manuel pas encore planifié.
  value: string | null
  // Heure proposée tant qu'aucune date n'est choisie.
  defaultTime: string
  // Mode manuel : la date reste facultative et peut être retirée.
  optional: boolean
  disabled: boolean
  // Incrémenté quand un enregistrement est refusé : les champs reviennent à `value`.
  revision: number
  onChange: (iso: string | null) => void
}

// Date et heure de publication, saisies à l'heure de Paris (Créneaux P0-3).
export function PostScheduleField({
  value,
  defaultTime,
  optional,
  disabled,
  revision,
  onChange,
}: PostScheduleFieldProps) {
  const saved = value ? isoToParis(value) : null
  const [open, setOpen] = useState(false)
  const [day, setDay] = useState(saved?.day ?? null)
  const [time, setTime] = useState(saved?.time ?? defaultTime)
  const [syncedWith, setSyncedWith] = useState({ value, revision })
  if (syncedWith.value !== value || syncedWith.revision !== revision) {
    setSyncedWith({ value, revision })
    setDay(saved?.day ?? null)
    setTime(saved?.time ?? defaultTime)
  }

  // La mention de l'heure locale lit le fuseau du navigateur : absente du rendu serveur.
  const isClient = useSyncExternalStore(noSubscription, () => true, () => false)
  const validTime = timeSchema.safeParse(time).success ? time : (saved?.time ?? defaultTime)
  const mention = isClient && day ? localTimeMention(day, validTime) : null
  const today = todayInParis()

  function commitTime() {
    if (!timeSchema.safeParse(time).success) {
      setTime(saved?.time ?? defaultTime)
      return
    }
    // Sans date, l'heure attend le choix du jour.
    if (!day || (saved && saved.day === day && saved.time === time)) return
    onChange(parisDateTimeToIso(day, time))
  }

  function selectDay(next: string) {
    setDay(next)
    setOpen(false)
    onChange(parisDateTimeToIso(next, validTime))
  }

  function clearDate() {
    setDay(null)
    setOpen(false)
    onChange(null)
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Field>
        <FieldLabel htmlFor="post-date">Date de publication</FieldLabel>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            disabled={disabled}
            render={
              <Button
                id="post-date"
                variant="outline"
                className="h-10 w-full justify-start gap-2 px-3 font-normal"
              />
            }
          >
            <CalendarDays aria-hidden className="text-muted-foreground" />
            {day ? (
              formatDayLabel(day)
            ) : (
              <span className="text-muted-foreground">
                {optional ? "Non planifiée" : "Choisir une date"}
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              required
              locale={fr}
              selected={day ? dayToLocalDate(day) : undefined}
              defaultMonth={dayToLocalDate(day ?? today)}
              disabled={{ before: dayToLocalDate(today) }}
              onSelect={(date) => selectDay(localDateToDay(date))}
            />
            {optional && day && (
              <div className="border-t p-2">
                <Button variant="ghost" size="sm" className="w-full" onClick={clearDate}>
                  <X aria-hidden />
                  Retirer la date
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </Field>

      <Field>
        <FieldLabel htmlFor="post-time">Heure (Paris)</FieldLabel>
        <Input
          id="post-time"
          type="time"
          step={300}
          value={time}
          disabled={disabled}
          onChange={(event) => setTime(event.target.value)}
          onBlur={commitTime}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitTime()
          }}
          className="h-10 px-3"
        />
        {mention && <FieldDescription className="text-xs text-subtle-foreground">{mention}</FieldDescription>}
      </Field>
    </div>
  )
}
