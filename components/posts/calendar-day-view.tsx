import { Plus, X } from "lucide-react"
import Link from "next/link"

import { NewPostButton } from "@/components/posts/new-post-button"
import { PostCard } from "@/components/posts/post-card"
import { SuggestionCard } from "@/components/posts/suggestion-card"
import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { formatDayLong, type CalendarPost } from "@/lib/calendar"
import type { Suggestion } from "@/lib/suggestions"

type CalendarDayViewProps = {
  day: string
  posts: CalendarPost[]
  suggestions: Suggestion[]
  lineNameById: Map<string, string>
  lineNameByCode: Map<string, string>
  today: string
  closeHref: string
  // Nom de l'onglet rouvert à la fermeture, pour le libellé accessible du bouton.
  closeLabel: string
}

const CARD_GRID = "grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] items-start gap-3"

// Vue jour (spec Mon calendrier 3.5) : posts puis suggestions du jour sélectionné. La création
// préremplie n'est proposée que pour aujourd'hui ou un jour à venir. L'agenda n'est pas lu en v1.
export function CalendarDayView({
  day,
  posts,
  suggestions,
  lineNameById,
  lineNameByCode,
  today,
  closeHref,
  closeLabel,
}: CalendarDayViewProps) {
  const isPast = day < today
  const isEmpty = posts.length === 0 && suggestions.length === 0

  return (
    <section aria-labelledby="day-title" className="grid min-w-0 gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="day-title" className="text-[22px] first-letter:uppercase">
          {formatDayLong(day)}
        </h2>
        <Link
          href={closeHref}
          scroll={false}
          aria-label={closeLabel}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <X aria-hidden />
        </Link>
      </div>

      {isEmpty ? (
        <Empty className="items-start rounded-xl bg-card px-4 py-6 text-left">
          <EmptyHeader className="items-start">
            <EmptyDescription>
              {isPast ? "Aucune publication ce jour-là." : "Rien de prévu ce jour. Une idée en tête ?"}
            </EmptyDescription>
          </EmptyHeader>
          {!isPast && (
            <EmptyContent className="items-start">
              <NewPostButton prefill={{ date: day }} variant="secondary" size="sm">
                <Plus aria-hidden />
                Créer un post ce jour
              </NewPostButton>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className={CARD_GRID}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              lineName={post.editorial_line_id ? (lineNameById.get(post.editorial_line_id) ?? null) : null}
            />
          ))}
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.key}
              suggestion={suggestion}
              lineName={lineNameByCode.get(suggestion.lineCode) ?? suggestion.lineCode}
            />
          ))}
        </div>
      )}

      {!isEmpty && !isPast && (
        <div>
          <NewPostButton prefill={{ date: day }} variant="ghost" size="sm">
            <Plus aria-hidden />
            Créer un post ce jour
          </NewPostButton>
        </div>
      )}
    </section>
  )
}
