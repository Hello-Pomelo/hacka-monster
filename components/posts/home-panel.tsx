import { Plus, Sparkles, X } from "lucide-react"
import Link from "next/link"

import { IdeasBox, type Idea } from "@/components/posts/ideas-box"
import { NewPostButton } from "@/components/posts/new-post-button"
import { PostCard, postInstant } from "@/components/posts/post-card"
import { SuggestionCard } from "@/components/posts/suggestion-card"
import { UpcomingList } from "@/components/posts/upcoming-list"
import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Post } from "@/lib/posts"
import type { Tables } from "@/lib/supabase/database.types"
import { formatDayLong, parisDay, type Suggestion } from "@/lib/suggestions"

type HomePanelProps = {
  posts: Post[]
  suggestions: Suggestion[]
  ideas: Idea[]
  selectedDay: string | null
  tab: "suggestions" | "a-venir" | "idees"
  lines: Pick<Tables<"editorial_lines">, "id" | "code" | "name">[]
  today: string
}

const TRIGGER_CLASS =
  "group/tab h-full flex-none px-1 text-muted-foreground after:bg-primary group-data-horizontal/tabs:after:bottom-[-1px]"

const CARD_GRID = "grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] items-start gap-3"

function Count({ value }: { value: number }) {
  return (
    <span className="inline-grid h-5 min-w-5 place-items-center rounded-full bg-chip px-1.5 text-xs text-chip-foreground tabular-nums group-data-active/tab:bg-primary group-data-active/tab:text-primary-foreground">
      {value}
    </span>
  )
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

// Bloc sous le calendrier (spec Mon calendrier, 3.5) : vue du jour sélectionné, sinon onglets.
export function HomePanel({ posts, suggestions, ideas, selectedDay, tab, lines, today }: HomePanelProps) {
  const lineNameById = new Map(lines.map((line) => [line.id, line.name]))
  const lineNameByCode = new Map(lines.map((line) => [line.code, line.name]))
  const lineName = (post: Post) =>
    post.editorial_line_id ? (lineNameById.get(post.editorial_line_id) ?? null) : null

  if (selectedDay) {
    const dayPosts = posts
      .filter((post) => parisDay(postInstant(post)) === selectedDay)
      .sort((a, b) => postInstant(a).localeCompare(postInstant(b)))
    const daySuggestions = suggestions.filter((suggestion) => suggestion.date === selectedDay)
    const isPast = selectedDay < today
    const createButton = (
      <NewPostButton prefill={{ date: selectedDay }} variant="secondary" size="sm">
        <Plus aria-hidden />
        Créer un post ce jour
      </NewPostButton>
    )

    return (
      <section aria-labelledby="day-title" className="grid min-w-0 gap-4">
        <div className="flex items-center justify-between gap-2">
          <h2 id="day-title" className="text-[22px] first-letter:uppercase">
            {formatDayLong(selectedDay)}
          </h2>
          <Link
            href="/"
            scroll={false}
            aria-label="Fermer le jour sélectionné"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <X aria-hidden />
          </Link>
        </div>

        {dayPosts.length > 0 ? (
          <div className={CARD_GRID}>
            {dayPosts.map((post) => (
              <PostCard key={post.id} post={post} lineName={lineName(post)} />
            ))}
          </div>
        ) : (
          <Empty className="items-start rounded-xl bg-card px-4 py-6 text-left">
            <EmptyHeader className="items-start">
              <EmptyDescription>
                {isPast ? "Aucune publication ce jour-là." : "Rien de prévu ce jour."}
              </EmptyDescription>
            </EmptyHeader>
            {!isPast && daySuggestions.length === 0 && (
              <EmptyContent className="items-start">{createButton}</EmptyContent>
            )}
          </Empty>
        )}

        {daySuggestions.length > 0 && (
          <SuggestionGrid suggestions={daySuggestions} lineNameByCode={lineNameByCode} />
        )}
        {!isPast && (dayPosts.length > 0 || daySuggestions.length > 0) && <div>{createButton}</div>}
      </section>
    )
  }

  const upcoming = posts
    .filter((post) => post.status !== "published" && post.status !== "archived")
    .filter((post) => parisDay(postInstant(post)) >= today)
    .sort((a, b) => postInstant(a).localeCompare(postInstant(b)))

  return (
    <section aria-label="Suggestions, posts à venir et idées" className="min-w-0">
      <Tabs defaultValue={tab} className="gap-4">
        <TabsList
          variant="line"
          className="w-full justify-start gap-3 rounded-none border-b p-0 group-data-horizontal/tabs:h-10"
        >
          <TabsTrigger value="suggestions" className={TRIGGER_CLASS}>
            <Sparkles aria-hidden />
            Suggestions
            <Count value={suggestions.length} />
          </TabsTrigger>
          <TabsTrigger value="a-venir" className={TRIGGER_CLASS}>
            À venir
            <Count value={upcoming.length} />
          </TabsTrigger>
          <TabsTrigger value="idees" className={TRIGGER_CLASS}>
            Idées
            <Count value={ideas.length} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions">
          {suggestions.length > 0 ? (
            <SuggestionGrid suggestions={suggestions} lineNameByCode={lineNameByCode} />
          ) : (
            <Empty className="rounded-xl bg-card">
              <EmptyHeader>
                <EmptyDescription>
                  Aucune suggestion : votre rythme de publication est tenu.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </TabsContent>

        <TabsContent value="a-venir">
          <UpcomingList posts={upcoming} lineNames={lineNameById} />
        </TabsContent>

        <TabsContent value="idees">
          <IdeasBox ideas={ideas} />
        </TabsContent>
      </Tabs>
    </section>
  )
}
