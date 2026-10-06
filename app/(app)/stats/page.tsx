import type { Metadata } from "next"
import { ChartColumn, ChartNoAxesColumn, Info } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImpressionsChart, type ImpressionsDatum } from "@/components/stats/impressions-chart"
import { KpiTiles } from "@/components/stats/kpi-tiles"
import { PostsTable, type PostTableRow } from "@/components/stats/posts-table"
import { FilterButton, StatsShell } from "@/components/stats/stats-shell"
import { TypeChart, TypeTable, type TypeDatum } from "@/components/stats/type-chart"
import {
  compareSummaries,
  interactionRate,
  interactionsOf,
  latestCapture,
  performanceByType,
  summarize,
} from "@/lib/stats/compute"
import { getPeriodRange, PERIODS, statsFiltersSchema } from "@/lib/stats/filters"
import { formatDate, formatDay, formatShortDate } from "@/lib/stats/format"
import { getPublishedPostStats, postTypeLabel } from "@/lib/stats/queries"

export const metadata: Metadata = {
  title: "Statistiques · Hacka Monster",
}

// Libellés des onglets en gris foncé (contraste AA sur le fond bg-chip), segment actif sans ombre portée.
const tabTriggerClass =
  "text-muted-foreground group-data-[variant=default]/tabs-list:data-active:shadow-[inset_0_0_0_1px_var(--color-border)]"

// Statistiques LinkedIn des posts publiés de la page, visibles par tous les admins (D27).
export default async function StatsPage({ searchParams }: PageProps<"/stats">) {
  const filters = statsFiltersSchema.parse(await searchParams)
  const period = PERIODS[filters.periode]
  const range = getPeriodRange(filters.periode, new Date())

  // Période courante et précédente en une lecture, séparées par la date de publication.
  const rows = await getPublishedPostStats({ from: range.previousStart, to: range.end, line: filters.ligne })
  const startTime = range.start.getTime()
  const current = rows.filter((row) => Date.parse(row.publishedAt) >= startTime)
  const previous = rows.filter((row) => Date.parse(row.publishedAt) < startTime)

  const summary = summarize(current)
  const deltas = compareSummaries(summary, summarize(previous))
  const lastCapture = latestCapture(current)

  const chartData: ImpressionsDatum[] = current
    .toSorted((a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt))
    .flatMap(({ id, title, lineName, publishedAt, metrics }) => {
      if (!metrics) return []
      const interactions = interactionsOf(metrics)
      return {
        id,
        title,
        line: lineName,
        date: formatShortDate(publishedAt),
        impressions: metrics.impressions,
        interactions,
        rate: interactionRate(interactions, metrics.impressions),
      }
    })

  const typeData: TypeDatum[] = performanceByType(current).map((entry) => ({
    type: entry.type,
    label: postTypeLabel(entry.type),
    rate: entry.rate,
    posts: entry.posts,
    averageImpressions: entry.averageImpressions,
  }))

  const tableRows: PostTableRow[] = current.map(({ metrics, ...row }) => ({
    id: row.id,
    publishedAt: row.publishedAt,
    date: formatDate(row.publishedAt),
    title: row.title,
    typeLabel: postTypeLabel(row.type),
    lineName: row.lineName,
    authorName: row.authorName,
    impressions: metrics?.impressions ?? null,
    reactions: metrics?.reactions ?? null,
    comments: metrics?.comments ?? null,
    reposts: metrics?.reposts ?? null,
    clicks: metrics?.clicks ?? null,
    rate: metrics ? interactionRate(interactionsOf(metrics), metrics.impressions) : null,
  }))

  return (
    <>
      <header className="grid max-w-[720px] min-w-0 gap-3">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-tag-border bg-tag px-2.5 py-1 text-xs font-medium tracking-[0.06em] text-tag-foreground uppercase">
          <ChartColumn aria-hidden className="size-4" />
          Statistiques
        </span>
        <h1 className="font-heading text-[32px]">Performances des posts</h1>
        <p className="text-muted-foreground">
          Impressions et interactions des posts publiés sur la page LinkedIn.
        </p>
        <p className="flex items-start gap-2 rounded-lg bg-chip px-3 py-2 text-[13px] text-chip-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          {lastCapture
            ? `Chiffres LinkedIn au ${formatDay(lastCapture)}, d'après le dernier relevé de chaque post.`
            : "Aucun relevé LinkedIn sur cette période pour l'instant."}
        </p>
      </header>

      <StatsShell filters={filters}>
        {current.length === 0 ? (
          <Empty className="rounded-xl bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ChartNoAxesColumn />
              </EmptyMedia>
              <EmptyTitle>
                <h2 className="text-lg">Aucun post publié sur {period.current}</h2>
              </EmptyTitle>
              <EmptyDescription>
                Les statistiques d&apos;un post apparaissent ici après son premier relevé LinkedIn.
              </EmptyDescription>
            </EmptyHeader>
            {filters.periode !== "12m" && (
              <EmptyContent>
                <FilterButton filters={{ periode: "12m" }}>Voir les 12 derniers mois</FilterButton>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <>
            <KpiTiles
              summary={summary}
              deltas={deltas}
              period={filters.periode}
              periodDays={period.days}
              comparisonLabel={`vs ${period.previous}`}
            />

            {summary.impressions > 0 ? (
              <div className="grid items-start gap-6 min-[1100px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <Card className="ring-0">
                  <CardHeader>
                    <CardTitle>
                      <h2 className="text-lg">Impressions par post</h2>
                    </CardTitle>
                    <CardDescription>
                      Posts publiés sur {period.current}, du plus ancien au plus récent. Le détail est
                      dans le tableau ci-dessous.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImpressionsChart data={chartData} />
                  </CardContent>
                </Card>

                <Card className="ring-0">
                  <Tabs defaultValue="chart" className="gap-4">
                    <CardHeader>
                      <CardTitle>
                        <h2 className="text-lg">Taux d&apos;interaction par type</h2>
                      </CardTitle>
                      <CardDescription>Les sujets qui font le plus réagir.</CardDescription>
                      <CardAction>
                        <TabsList className="bg-chip">
                          <TabsTrigger value="chart" className={tabTriggerClass}>
                            Graphique
                          </TabsTrigger>
                          <TabsTrigger value="table" className={tabTriggerClass}>
                            Tableau
                          </TabsTrigger>
                        </TabsList>
                      </CardAction>
                    </CardHeader>
                    <CardContent>
                      <TabsContent value="chart">
                        <TypeChart data={typeData} />
                      </TabsContent>
                      <TabsContent value="table">
                        <TypeTable data={typeData} />
                      </TabsContent>
                    </CardContent>
                  </Tabs>
                </Card>
              </div>
            ) : (
              <Empty className="rounded-xl bg-card">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ChartNoAxesColumn />
                  </EmptyMedia>
                  <EmptyTitle>
                    <h2 className="text-lg">Statistiques en attente</h2>
                  </EmptyTitle>
                  <EmptyDescription>
                    {summary.postsWithMetrics === 0
                      ? "Les posts de cette période n'ont pas encore de relevé LinkedIn. Les graphiques s'afficheront après la première synchronisation."
                      : "LinkedIn n'a pas encore compté d'impression pour ces posts. Les graphiques s'afficheront dès les premières vues."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}

            <Card className="ring-0">
              <CardHeader>
                <CardTitle>
                  <h2 id="stats-posts-title" className="text-lg">
                    Détail par post
                  </h2>
                </CardTitle>
                <CardDescription>
                  Totaux depuis la publication, d&apos;après le dernier relevé LinkedIn. Cliquez sur
                  un en-tête pour trier.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PostsTable rows={tableRows} labelledBy="stats-posts-title" />
              </CardContent>
            </Card>
          </>
        )}
      </StatsShell>
    </>
  )
}
