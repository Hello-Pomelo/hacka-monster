import { Check, Sparkles, TriangleAlert } from "lucide-react"

import { CalendarDay, type DayItem } from "@/components/posts/calendar-day"
import { CalendarToolbar } from "@/components/posts/calendar-toolbar"
import {
  homeHref,
  monthGrid,
  monthOf,
  WEEKDAY_LABELS,
  type CalendarPost,
  type HomeView,
} from "@/lib/calendar"
import type { Suggestion } from "@/lib/suggestions"

function Legend({ showSuggestions }: { showSuggestions: boolean }) {
  return (
    <ul aria-label="Légende" className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <li className="inline-flex items-center gap-1.5">
        <span aria-hidden className="h-2.5 w-3.5 rounded-[2px] bg-event" />
        Programmé
      </li>
      <li className="inline-flex items-center gap-1.5">
        <span aria-hidden className="h-2.5 w-3.5 rounded-[2px] border border-input" />
        Brouillon
      </li>
      <li className="inline-flex items-center gap-1.5">
        <Check aria-hidden className="size-3 text-success" />
        Publié
      </li>
      <li className="inline-flex items-center gap-1.5">
        <TriangleAlert aria-hidden className="size-3 text-destructive" />
        Échec
      </li>
      {showSuggestions && (
        <li className="inline-flex items-center gap-1.5">
          <Sparkles aria-hidden className="size-3 text-tag-foreground" />
          Suggestion
        </li>
      )}
    </ul>
  )
}

type PostCalendarProps = {
  posts: CalendarPost[]
  suggestions: Suggestion[]
  view: HomeView
  today: string
}

// Calendrier mensuel des posts de la page (spec Mon calendrier 3.4), navigation par l'URL.
export function PostCalendar({ posts, suggestions, view, today }: PostCalendarProps) {
  const days = monthGrid(view.month)
  const byDay = new Map<string, DayItem[]>()
  const push = (day: string, item: DayItem) => byDay.set(day, [...(byDay.get(day) ?? []), item])
  for (const post of posts) push(post.day, { kind: "post", post })
  if (view.showSuggestions) {
    for (const suggestion of suggestions) push(suggestion.date, { kind: "suggestion", suggestion })
  }

  return (
    <section aria-label="Calendrier des publications" className="grid min-w-0 gap-3 rounded-xl bg-card p-4">
      <CalendarToolbar view={view} today={today} />

      <div className="overflow-hidden rounded-xl border">
        <div aria-hidden className="grid grid-cols-7 border-b">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="px-2.5 py-2 text-xs tracking-[0.06em] text-subtle-foreground uppercase">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => (
            <CalendarDay
              key={day}
              day={day}
              href={homeHref(view, { month: monthOf(day), day })}
              items={byDay.get(day) ?? []}
              isOutside={monthOf(day) !== view.month}
              isToday={day === today}
              isPast={day < today}
              isSelected={day === view.day}
              isLastColumn={index % 7 === 6}
              isLastRow={index >= days.length - 7}
            />
          ))}
        </div>
      </div>

      <Legend showSuggestions={view.showSuggestions} />
    </section>
  )
}
