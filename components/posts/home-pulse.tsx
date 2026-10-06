import { History } from "lucide-react"
import type { ReactNode } from "react"

import { badgeVariants } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  daysBetween,
  daysInMonth,
  formatDayShort,
  formatMonthName,
  monthOf,
  type CalendarPost,
} from "@/lib/calendar"
import type { PostStatus } from "@/lib/posts"
import { cn } from "@/lib/utils"

const WEEK_DAYS = 7
const COUNTED_IN_MONTH: PostStatus[] = ["scheduled", "published"]

// Badge rendu en `span` : le composant `Badge` (Base UI) ne s'exécute pas dans un Server Component.
const BADGE_CLASS = "h-[22px] text-[11px] tracking-[0.05em] uppercase"

function PulseCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Card className="gap-2 px-4 py-4 ring-0">
      <span className="text-xs tracking-[0.06em] text-subtle-foreground uppercase">{label}</span>
      {children}
    </Card>
  )
}

function PulseValue({ value, detail }: { value: ReactNode; detail?: string }) {
  return (
    <span className="font-heading text-2xl leading-none font-medium tracking-[-0.04em] tabular-nums">
      {value}{" "}
      {detail && (
        <small className="font-sans text-[13px] font-normal tracking-normal text-muted-foreground">
          {detail}
        </small>
      )}
    </span>
  )
}

function LastPublished({
  posts,
  today,
  targetPerWeek,
}: {
  posts: CalendarPost[]
  today: string
  targetPerWeek: number
}) {
  const last = posts
    .filter((post) => post.status === "published" && post.day <= today)
    .reduce<CalendarPost | null>((latest, post) => (!latest || post.at > latest.at ? post : latest), null)

  if (!last) {
    return (
      <PulseCard label="Dernier post sur la page">
        <PulseValue value="Aucun" detail="post publié" />
        <span className="text-xs text-subtle-foreground">Aucun post publié sur la page.</span>
      </PulseCard>
    )
  }

  const days = daysBetween(last.day, today)
  // Délai visé entre deux posts : une semaine divisée par la fréquence cible.
  const maxGap = targetPerWeek > 0 ? WEEK_DAYS / targetPerWeek : WEEK_DAYS
  return (
    <PulseCard label="Dernier post sur la page">
      {days === 0 ? (
        <PulseValue value="Aujourd'hui" detail={`à ${last.time}`} />
      ) : (
        <PulseValue
          value={`${days} jour${days > 1 ? "s" : ""}`}
          detail={`le ${formatDayShort(last.day)}`}
        />
      )}
      {days > maxGap && targetPerWeek > 0 && (
        <span>
          <span
            className={cn(
              badgeVariants({ variant: "secondary" }),
              BADGE_CLASS,
              "bg-warning-surface text-warning"
            )}
          >
            <History aria-hidden />
            Objectif : {targetPerWeek} par semaine
          </span>
        </span>
      )}
    </PulseCard>
  )
}

type HomePulseProps = {
  posts: CalendarPost[]
  today: string
  // Somme des fréquences cibles des lignes filtrées.
  targetPerWeek: number
  // Suggestions d'ici la fin du mois en cours.
  suggestionCount: number
}

// Indicateurs de rythme de publication de la page (spec Mon calendrier 3.3).
export function HomePulse({ posts, today, targetPerWeek, suggestionCount }: HomePulseProps) {
  const month = monthOf(today)
  const monthName = formatMonthName(month)
  const monthCount = posts.filter(
    (post) => monthOf(post.day) === month && COUNTED_IN_MONTH.includes(post.status)
  ).length
  const goal = Math.round((targetPerWeek * daysInMonth(month)) / WEEK_DAYS)

  return (
    <section aria-label="Rythme de publication" className="grid grid-cols-3 gap-4">
      <LastPublished posts={posts} today={today} targetPerWeek={targetPerWeek} />

      <PulseCard label={`Programmés en ${monthName}`}>
        <PulseValue value={monthCount} detail={`sur ${goal} visé${goal > 1 ? "s" : ""}`} />
        <Progress
          value={goal > 0 ? Math.min(100, (monthCount / goal) * 100) : 0}
          aria-label={`${monthCount} sur ${goal} visés`}
          className="[&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-chip"
        />
      </PulseCard>

      <PulseCard label="Suggestions à traiter">
        <PulseValue value={suggestionCount} detail={`d'ici fin ${monthName}`} />
        <span className="text-xs text-subtle-foreground">
          {suggestionCount === 0
            ? "Aucune suggestion en attente."
            : "Idées de posts tirées de votre rythme de publication."}
        </span>
      </PulseCard>
    </section>
  )
}
