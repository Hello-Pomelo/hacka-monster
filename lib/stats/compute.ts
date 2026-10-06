// Calculs de l'écran Statistiques, sans accès à la base : testables à part.
// Taux d'interaction = (réactions + commentaires + republications) / impressions.
// Les clics en sont exclus : LinkedIn ne les fournit que pour une page entreprise,
// et le taux doit rester comparable quand les comptes perso arriveront (P2).

export type PostMetrics = {
  capturedOn: string
  impressions: number
  membersReached: number | null
  reactions: number
  comments: number
  reposts: number
  clicks: number | null
}

export type PostStatsRow = {
  id: string
  title: string
  type: string
  lineName: string | null
  authorName: string
  publishedAt: string
  // Null tant que la synchro LinkedIn n'a fait aucun relevé pour ce post.
  metrics: PostMetrics | null
}

export type StatsSummary = {
  posts: number
  postsWithMetrics: number
  impressions: number
  reactions: number
  comments: number
  reposts: number
  interactions: number
  rate: number | null
}

export type StatsDeltas = {
  impressions: number | null
  interactions: number | null
  ratePoints: number | null
  posts: number
}

export type TypePerformance = {
  type: string
  posts: number
  impressions: number
  interactions: number
  rate: number
  averageImpressions: number
}

export function interactionsOf(metrics: PostMetrics): number {
  return metrics.reactions + metrics.comments + metrics.reposts
}

export function interactionRate(interactions: number, impressions: number): number | null {
  return impressions > 0 ? interactions / impressions : null
}

export function summarize(rows: PostStatsRow[]): StatsSummary {
  const summary = {
    posts: rows.length,
    postsWithMetrics: 0,
    impressions: 0,
    reactions: 0,
    comments: 0,
    reposts: 0,
  }
  for (const { metrics } of rows) {
    if (!metrics) continue
    summary.postsWithMetrics += 1
    summary.impressions += metrics.impressions
    summary.reactions += metrics.reactions
    summary.comments += metrics.comments
    summary.reposts += metrics.reposts
  }
  const interactions = summary.reactions + summary.comments + summary.reposts
  return { ...summary, interactions, rate: interactionRate(interactions, summary.impressions) }
}

// Variation relative, ou null si la base de comparaison est nulle.
function relativeChange(current: number, previous: number): number | null {
  return previous > 0 ? (current - previous) / previous : null
}

// Les variations relatives demandent des relevés des deux côtés ; l'écart de posts publiés
// se calcule toujours, une période précédente sans post valant zéro.
export function compareSummaries(current: StatsSummary, previous: StatsSummary): StatsDeltas {
  const comparable = current.postsWithMetrics > 0 && previous.postsWithMetrics > 0
  return {
    impressions: comparable ? relativeChange(current.impressions, previous.impressions) : null,
    interactions: comparable ? relativeChange(current.interactions, previous.interactions) : null,
    ratePoints:
      comparable && current.rate !== null && previous.rate !== null
        ? current.rate - previous.rate
        : null,
    posts: current.posts - previous.posts,
  }
}

// Sens d'une variation à la précision affichée (pas de flèche à côté d'un « 0 % »).
// step : 0.01 pour un pourcentage entier, 0.001 pour un dixième de point.
export function directionAt(value: number, step: number): -1 | 0 | 1 {
  return Math.sign(Math.round(value / step)) as -1 | 0 | 1
}

// Performance par type de post, du meilleur taux d'interaction au moins bon.
export function performanceByType(rows: PostStatsRow[]): TypePerformance[] {
  const byType = new Map<string, { posts: number; impressions: number; interactions: number }>()
  for (const row of rows) {
    if (!row.metrics) continue
    const entry = byType.get(row.type) ?? { posts: 0, impressions: 0, interactions: 0 }
    entry.posts += 1
    entry.impressions += row.metrics.impressions
    entry.interactions += interactionsOf(row.metrics)
    byType.set(row.type, entry)
  }
  return [...byType.entries()]
    .filter(([, entry]) => entry.impressions > 0)
    .map(([type, entry]) => ({
      type,
      ...entry,
      rate: entry.interactions / entry.impressions,
      averageImpressions: Math.round(entry.impressions / entry.posts),
    }))
    .sort((a, b) => b.rate - a.rate)
}

// Date du relevé le plus récent, pour afficher la fraîcheur des données.
export function latestCapture(rows: PostStatsRow[]): string | null {
  let latest: string | null = null
  for (const { metrics } of rows) {
    if (metrics && (latest === null || metrics.capturedOn > latest)) latest = metrics.capturedOn
  }
  return latest
}
