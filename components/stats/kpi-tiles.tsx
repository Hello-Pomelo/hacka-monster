import type { ReactNode } from "react"

import { Card } from "@/components/ui/card"
import { directionAt, type StatsDeltas, type StatsSummary } from "@/lib/stats/compute"
import type { PeriodId } from "@/lib/stats/filters"
import {
  formatNumber,
  formatPercent,
  formatSignedNumber,
  formatSignedPercent,
  formatSignedPoints,
} from "@/lib/stats/format"

import { Delta, type DeltaValue } from "./delta"

function plural(count: number, singular: string, pluralForm: string) {
  return `${formatNumber(count)} ${count > 1 ? pluralForm : singular}`
}

function KpiTile({
  label,
  value,
  unit,
  detail,
  delta,
}: {
  label: string
  value: string
  unit?: string
  detail?: string
  delta: ReactNode
}) {
  return (
    <Card className="gap-2 px-4 py-4 ring-0">
      <span className="text-xs tracking-[0.06em] text-subtle-foreground uppercase">{label}</span>
      <span className="font-heading text-2xl leading-none font-medium tracking-[-0.04em] tabular-nums">
        {value}
        {unit && (
          <small className="ml-1.5 font-sans text-[13px] font-normal tracking-normal text-muted-foreground normal-nums">
            {unit}
          </small>
        )}
      </span>
      {detail && <span className="text-xs text-subtle-foreground">{detail}</span>}
      {delta}
    </Card>
  )
}

// Rythme de publication : par semaine, ou par mois sur 12 mois (une valeur par semaine y serait illisible).
function rhythm(posts: number, period: PeriodId, days: number): string {
  const [count, unit] = period === "12m" ? [posts / 12, "mois"] : [posts / (days / 7), "semaine"]
  if (posts > 0 && count < 0.05) return `moins de 0,1 par ${unit}`
  return `soit ${count.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} par ${unit}`
}

const NO_PREVIOUS: DeltaValue = { unavailable: "Pas de relevé sur la période précédente" }

function percentDelta(change: number | null): DeltaValue {
  if (change === null) return NO_PREVIOUS
  return { direction: directionAt(change, 0.01), text: formatSignedPercent(change) }
}

// Chiffres clés de la période, comparés à la période précédente de même durée.
// Sans relevé ou sans impression, les mesures LinkedIn affichent « n.d. » plutôt qu'un zéro trompeur.
export function KpiTiles({
  summary,
  deltas,
  period,
  periodDays,
  comparisonLabel,
}: {
  summary: StatsSummary
  deltas: StatsDeltas
  period: PeriodId
  periodDays: number
  comparisonLabel: string
}) {
  const hasMetrics = summary.postsWithMetrics > 0
  const noCapture = <Delta value={{ unavailable: "Pas encore de relevé LinkedIn" }} comparisonLabel="" />

  const rateDelta: DeltaValue =
    summary.rate === null
      ? { unavailable: "Aucune impression sur la période" }
      : deltas.ratePoints === null
        ? NO_PREVIOUS
        : { direction: directionAt(deltas.ratePoints, 0.001), text: formatSignedPoints(deltas.ratePoints) }

  return (
    <section
      aria-label="Chiffres clés"
      className="grid grid-cols-1 gap-3 min-[560px]:grid-cols-2 min-[900px]:gap-4 min-[1100px]:grid-cols-4"
    >
      <KpiTile
        label="Impressions"
        value={hasMetrics ? formatNumber(summary.impressions) : "n.d."}
        unit={hasMetrics ? `sur ${plural(summary.postsWithMetrics, "post", "posts")}` : undefined}
        delta={
          hasMetrics ? (
            <Delta value={percentDelta(deltas.impressions)} comparisonLabel={comparisonLabel} />
          ) : (
            noCapture
          )
        }
      />
      <KpiTile
        label="Taux d'interaction"
        value={summary.rate === null ? "n.d." : formatPercent(summary.rate)}
        detail="(Réactions + commentaires + republications) / impressions"
        delta={hasMetrics ? <Delta value={rateDelta} comparisonLabel={comparisonLabel} /> : noCapture}
      />
      <KpiTile
        label="Interactions"
        value={hasMetrics ? formatNumber(summary.interactions) : "n.d."}
        detail={
          hasMetrics
            ? `${plural(summary.reactions, "réaction", "réactions")} · ${plural(summary.comments, "commentaire", "commentaires")} · ${plural(summary.reposts, "republication", "republications")}`
            : undefined
        }
        delta={
          hasMetrics ? (
            <Delta value={percentDelta(deltas.interactions)} comparisonLabel={comparisonLabel} />
          ) : (
            noCapture
          )
        }
      />
      <KpiTile
        label="Posts publiés"
        value={formatNumber(summary.posts)}
        unit={rhythm(summary.posts, period, periodDays)}
        delta={
          <Delta
            value={{
              direction: Math.sign(deltas.posts) as -1 | 0 | 1,
              text: `${formatSignedNumber(deltas.posts)} ${Math.abs(deltas.posts) > 1 ? "posts" : "post"}`,
            }}
            comparisonLabel={comparisonLabel}
          />
        }
      />
    </section>
  )
}
