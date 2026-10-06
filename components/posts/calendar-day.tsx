import { Check, Clock, Loader, Sparkles, TriangleAlert, type LucideIcon } from "lucide-react"
import Link from "next/link"

import { dayOfMonth, formatDayLong, type CalendarPost } from "@/lib/calendar"
import { DISPLAY_LABELS, displayStatus, postTitle, type DisplayStatus } from "@/lib/posts"
import type { Suggestion } from "@/lib/suggestions"
import { cn } from "@/lib/utils"

// Au-delà, la case affiche « + N autres ».
const MAX_ITEMS = 3

const ITEM_BASE =
  "pointer-events-auto flex h-[26px] w-full min-w-0 items-center gap-1.5 rounded-lg px-2 text-left text-xs transition-colors [&_svg]:size-[13px] [&_svg]:shrink-0"

// Programmé et en cours de publication : aplat bleu nuit sur deux lignes, heure puis titre.
const ITEM_PROMINENT =
  "grid h-auto min-h-[26px] grid-cols-[auto_minmax(0,1fr)] gap-x-1.5 gap-y-0.5 bg-event py-1.5 leading-4 font-medium text-event-foreground hover:bg-event-hover [&_svg]:text-event-muted"

const ITEM_STYLES: Record<Exclude<DisplayStatus, "archived" | "pending">, string> = {
  scheduled: ITEM_PROMINENT,
  publishing: ITEM_PROMINENT,
  to_review: "border border-input text-muted-foreground hover:bg-accent",
  draft: "border border-input text-muted-foreground hover:bg-accent",
  failed: "border border-destructive text-destructive hover:bg-accent",
  published: "text-subtle-foreground hover:bg-accent [&_svg]:text-success",
}

const ITEM_ICONS: Partial<Record<DisplayStatus, LucideIcon>> = {
  scheduled: Clock,
  publishing: Loader,
  failed: TriangleAlert,
  published: Check,
}

export type DayItem =
  | { kind: "post"; post: CalendarPost }
  | { kind: "suggestion"; suggestion: Suggestion }

// Un clic sur un post sélectionne le jour : le détail s'affiche sous le calendrier (spec 3.4).
function PostItem({ post, href, isOverflow }: { post: CalendarPost; href: string; isOverflow: boolean }) {
  const status = displayStatus(post)
  if (status === "archived" || status === "pending") return null

  const isProminent = status === "scheduled" || status === "publishing"
  const title = postTitle(post)
  const Icon = ITEM_ICONS[status]
  const label = DISPLAY_LABELS[status]
  const hint = status === "failed" && post.failure_reason ? post.failure_reason : `${label}, ${title}`

  return (
    <li className={cn("min-w-0", isOverflow && "hidden")}>
      <Link
        href={href}
        scroll={false}
        title={hint}
        aria-label={`${label}, ${post.time}, ${title}`}
        className={cn(ITEM_BASE, ITEM_STYLES[status])}
      >
        {Icon && <Icon aria-hidden />}
        {isProminent && <time className="shrink-0 font-semibold tabular-nums">{post.time}</time>}
        <span className={cn("min-w-0", isProminent ? "col-span-2 line-clamp-2" : "truncate")}>
          {status === "publishing" ? `Publication en cours · ${title}` : title}
        </span>
        {status === "to_review" && (
          <span className="ml-auto shrink-0 text-[10px] tracking-[0.05em] uppercase">{label}</span>
        )}
      </Link>
    </li>
  )
}

function SuggestionItem({
  suggestion,
  href,
  isOverflow,
}: {
  suggestion: Suggestion
  href: string
  isOverflow: boolean
}) {
  return (
    <li className={cn("min-w-0", isOverflow && "hidden")}>
      <Link
        href={href}
        scroll={false}
        title={suggestion.why}
        aria-label={`Suggestion, ${suggestion.title}`}
        className={cn(
          ITEM_BASE,
          "border border-dashed border-tag-border text-tag-foreground hover:bg-tag"
        )}
      >
        <Sparkles aria-hidden />
        <span className="min-w-0 truncate">{suggestion.title}</span>
      </Link>
    </li>
  )
}

type CalendarDayProps = {
  day: string
  href: string
  items: DayItem[]
  isOutside: boolean
  isToday: boolean
  isPast: boolean
  isSelected: boolean
  isLastColumn: boolean
  isLastRow: boolean
}

// Case du calendrier. Le numéro du jour est un lien étendu à toute la case (`after:inset-0`) ;
// les éléments passent au-dessus pour rester cliquables sans imbriquer de liens.
export function CalendarDay({
  day,
  href,
  items,
  isOutside,
  isToday,
  isPast,
  isSelected,
  isLastColumn,
  isLastRow,
}: CalendarDayProps) {
  const hidden = items.length - MAX_ITEMS
  const count = items.length
  const label = `${formatDayLong(day)}${count ? `, ${count} élément${count > 1 ? "s" : ""}` : ""}`

  return (
    <div
      className={cn(
        "relative flex min-h-[118px] min-w-0 flex-col gap-1 border-r border-b bg-card p-1.5 transition-colors hover:bg-accent",
        isLastColumn && "border-r-0",
        isLastRow && "border-b-0",
        isOutside && "bg-cell-off hover:bg-cell-off",
        isSelected && "ring-2 ring-ring ring-inset"
      )}
    >
      <Link
        href={href}
        scroll={false}
        aria-label={label}
        aria-current={isToday ? "date" : undefined}
        className={cn(
          "grid size-6 place-items-center rounded-full text-[13px] font-medium tabular-nums outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset",
          (isOutside || isPast) && "text-subtle-foreground",
          isToday && "bg-primary text-primary-foreground"
        )}
      >
        {dayOfMonth(day)}
      </Link>

      {count > 0 && (
        <ul className="pointer-events-none relative z-10 flex min-w-0 flex-col gap-[3px]">
          {items.map((item, index) =>
            item.kind === "post" ? (
              <PostItem key={item.post.id} post={item.post} href={href} isOverflow={index >= MAX_ITEMS} />
            ) : (
              <SuggestionItem
                key={item.suggestion.key}
                suggestion={item.suggestion}
                href={href}
                isOverflow={index >= MAX_ITEMS}
              />
            )
          )}
          {hidden > 0 && (
            <li className="px-1.5 text-[11px] text-muted-foreground">
              + {hidden} autre{hidden > 1 ? "s" : ""}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
