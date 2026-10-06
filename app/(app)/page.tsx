import { CircleAlert } from "lucide-react"
import type { Metadata } from "next"
import { z } from "zod"

import { HomeHeader } from "@/components/posts/home-header"
import { HomePanel } from "@/components/posts/home-panel"
import { HomePulse } from "@/components/posts/home-pulse"
import { LineBanner } from "@/components/posts/line-banner"
import { PostCalendar } from "@/components/posts/post-calendar"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  HOME_TABS,
  isDayKey,
  isMonthKey,
  lastDayOfMonth,
  LINE_FILTERS,
  monthOf,
  postMatchesLine,
  toCalendarPost,
  toDayKey,
  type HomeView,
} from "@/lib/calendar"
import { computeSuggestions } from "@/lib/suggestions"
import { requireProfile } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Mon calendrier" }

// Paramètre absent ou invalide : valeur par défaut, sans erreur.
const searchSchema = z.object({
  mois: z.string().refine(isMonthKey).optional().catch(undefined),
  jour: z.string().refine(isDayKey).optional().catch(undefined),
  ligne: z.enum(LINE_FILTERS).catch("toutes"),
  onglet: z.enum(HOME_TABS).catch("suggestions"),
  suggestions: z.enum(["0", "1"]).catch("1"),
})

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function LoadError() {
  return (
    <Empty className="rounded-xl bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlert className="text-destructive" />
        </EmptyMedia>
        <EmptyTitle>Impossible de charger le calendrier</EmptyTitle>
        <EmptyDescription>Rechargez la page dans quelques instants.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

// Accueil « Mon calendrier » : tous les posts de la page, quel que soit l'admin (D27).
export default async function HomePage({ searchParams }: HomePageProps) {
  const profile = await requireProfile()
  const search = searchSchema.parse(await searchParams)
  const now = new Date()
  const today = toDayKey(now)
  const view: HomeView = {
    month: search.mois ?? monthOf(search.jour ?? today),
    day: search.jour ?? null,
    line: search.ligne,
    tab: search.onglet,
    showSuggestions: search.suggestions === "1",
  }

  const supabase = await createClient()
  const [postsResult, linesResult, ideasResult, dismissedResult] = await Promise.all([
    supabase.from("posts").select("*").neq("status", "archived"),
    supabase.from("editorial_lines").select("id, code, name, target_per_week").order("code"),
    supabase
      .from("ideas")
      .select("id, text, created_at, author:profiles!ideas_created_by_fkey(nom)")
      .order("created_at", { ascending: false }),
    supabase.from("dismissed_suggestions").select("suggestion_key"),
  ])

  if (postsResult.error || linesResult.error || ideasResult.error || dismissedResult.error) {
    return (
      <>
        <LineBanner lineId={profile.line_id} />
        <HomeHeader name={profile.nom} scheduledCount={null} />
        <LoadError />
      </>
    )
  }

  const lines = linesResult.data
  const allPosts = postsResult.data
  const suggestions = computeSuggestions({
    posts: allPosts,
    lines,
    dismissedKeys: dismissedResult.data.map((row) => row.suggestion_key),
    today,
  })

  const filteredLines = view.line === "toutes" ? lines : lines.filter((line) => line.code === view.line)
  // Les posts sans ligne (importés de LinkedIn) restent visibles sous tous les filtres (contrat 6).
  const lineIds = view.line === "toutes" ? null : new Set(filteredLines.map((line) => line.id))
  const posts = allPosts
    .filter((post) => postMatchesLine(post, lineIds))
    .map(toCalendarPost)
    .sort((a, b) => a.at - b.at)
  const visibleSuggestions =
    view.line === "toutes" ? suggestions : suggestions.filter((s) => s.lineCode === view.line)

  const inOneMonth = new Date(now)
  inOneMonth.setMonth(inOneMonth.getMonth() + 1)
  const scheduledCount = allPosts.filter(
    (post) =>
      post.status === "scheduled" &&
      post.scheduled_at !== null &&
      new Date(post.scheduled_at) >= now &&
      new Date(post.scheduled_at) <= inOneMonth
  ).length

  const monthEnd = lastDayOfMonth(monthOf(today))
  // Objectif de rythme : lignes Marketing et RH seulement. Neutre, ligne de repli figée, n'a pas d'objectif.
  const targetPerWeek = filteredLines
    .filter((line) => line.code !== "neutre")
    .reduce((sum, line) => sum + line.target_per_week, 0)
  const ideas = ideasResult.data.map((idea) => ({
    id: idea.id,
    text: idea.text,
    created_at: idea.created_at,
    author: idea.author?.nom ?? "",
  }))

  return (
    <>
      <LineBanner lineId={profile.line_id} />
      <HomeHeader name={profile.nom} scheduledCount={scheduledCount} />
      <HomePulse
        posts={posts}
        today={today}
        targetPerWeek={targetPerWeek}
        suggestionCount={visibleSuggestions.filter((s) => s.date <= monthEnd).length}
      />
      <div className="grid min-w-0 gap-8">
        <PostCalendar posts={posts} suggestions={visibleSuggestions} view={view} today={today} />
        <HomePanel
          posts={posts}
          suggestions={visibleSuggestions}
          ideas={ideas}
          view={view}
          lines={lines}
          today={today}
        />
      </div>
    </>
  )
}
