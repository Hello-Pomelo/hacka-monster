import { CalendarDayView } from "@/components/posts/calendar-day-view"
import { HomeScrollTarget } from "@/components/posts/home-scroll-target"
import { HomeTabs } from "@/components/posts/home-tabs"
import { IdeasBox, type Idea } from "@/components/posts/ideas-box"
import { SuggestionCard } from "@/components/posts/suggestion-card"
import { UpcomingList } from "@/components/posts/upcoming-list"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { homeHref, type CalendarPost, type HomeTab, type HomeView } from "@/lib/calendar"
import type { Tables } from "@/lib/supabase/database.types"
import type { Suggestion } from "@/lib/suggestions"

type HomePanelProps = {
  posts: CalendarPost[]
  suggestions: Suggestion[]
  ideas: Idea[]
  view: HomeView
  lines: Pick<Tables<"editorial_lines">, "id" | "code" | "name">[]
  today: string
}

const CARD_GRID = "grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] items-start gap-3"

// Fermer la vue jour rouvre l'onglet porté par l'URL.
const CLOSE_LABELS: Record<HomeTab, string> = {
  suggestions: "Revenir aux suggestions",
  "a-venir": "Revenir aux posts à venir",
  idees: "Revenir aux idées",
}

function SuggestionGrid({
  suggestions,
  lineNameByCode,
}: {
  suggestions: Suggestion[]
  lineNameByCode: Map<string, string>
}) {
  return (
    <div className={CARD_GRID}>
      {suggestions.map((suggestion) => (
        <SuggestionCard
          key={suggestion.key}
          suggestion={suggestion}
          lineName={lineNameByCode.get(suggestion.lineCode) ?? suggestion.lineCode}
        />
      ))}
    </div>
  )
}

const byInstant = (a: CalendarPost, b: CalendarPost) => a.at - b.at

// Bloc sous le calendrier (spec Mon calendrier 3.5) : vue du jour sélectionné, sinon onglets.
// Les posts portent le jour de la grille (`CalendarPost.day`) : vue jour et calendrier concordent.
export function HomePanel({ posts, suggestions, ideas, view, lines, today }: HomePanelProps) {
  const lineNameById = new Map(lines.map((line) => [line.id, line.name]))
  const lineNameByCode = new Map(lines.map((line) => [line.code, line.name]))
  const scrollKey = view.day ?? (view.tab === "idees" ? "idees" : null)

  if (view.day) {
    const day = view.day
    return (
      <HomeScrollTarget scrollKey={scrollKey}>
        <CalendarDayView
          day={day}
          posts={posts.filter((post) => post.day === day).sort(byInstant)}
          suggestions={suggestions.filter((suggestion) => suggestion.date === day)}
          lineNameById={lineNameById}
          lineNameByCode={lineNameByCode}
          today={today}
          closeHref={homeHref(view, { day: null })}
          closeLabel={CLOSE_LABELS[view.tab]}
        />
      </HomeScrollTarget>
    )
  }

  const upcoming = posts
    .filter((post) => post.status !== "published" && post.status !== "archived" && post.day >= today)
    .sort(byInstant)

  return (
    <HomeScrollTarget scrollKey={scrollKey}>
      <HomeTabs
        counts={{ suggestions: suggestions.length, "a-venir": upcoming.length, idees: ideas.length }}
        suggestions={
          suggestions.length > 0 ? (
            <SuggestionGrid suggestions={suggestions} lineNameByCode={lineNameByCode} />
          ) : (
            <Empty className="rounded-xl bg-card">
              <EmptyHeader>
                <EmptyDescription>Aucune suggestion : votre rythme de publication est tenu.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )
        }
        upcoming={<UpcomingList posts={upcoming} lineNames={lineNameById} view={view} />}
        ideas={<IdeasBox ideas={ideas} />}
      />
    </HomeScrollTarget>
  )
}
