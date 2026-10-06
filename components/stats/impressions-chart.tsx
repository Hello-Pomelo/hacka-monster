"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
  type LabelProps,
  type TooltipContentProps,
  type TooltipValueType,
} from "recharts"

import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { formatCompact, formatNumber, formatPercent } from "@/lib/stats/format"

// Une barre par post publié, dans l'ordre chronologique. Libellés déjà formatés côté serveur.
export type ImpressionsDatum = {
  id: string
  date: string
  title: string
  // Ligne éditoriale du post, ou null s'il n'en a pas.
  line: string | null
  impressions: number
  interactions: number
  rate: number | null
}

const chartConfig = {
  impressions: { label: "Impressions", color: "var(--chart-1)" },
} satisfies ChartConfig

function PostTooltip({ active, payload }: TooltipContentProps<TooltipValueType, string | number>) {
  const datum = payload?.[0]?.payload as ImpressionsDatum | undefined
  if (!active || !datum) return null

  return (
    <div className="grid max-w-64 gap-1 rounded-lg border bg-background px-3 py-2 text-xs shadow-float">
      <span className="flex items-center gap-2 text-sm font-medium">
        <span className="h-0.5 w-3 shrink-0 rounded-full bg-(--color-impressions)" aria-hidden />
        {formatNumber(datum.impressions)} impressions
      </span>
      <span className="text-muted-foreground">
        {formatNumber(datum.interactions)} interactions
        {datum.rate !== null && ` · ${formatPercent(datum.rate)}`}
      </span>
      <span className="line-clamp-2 text-muted-foreground">{datum.title}</span>
      <span className="text-subtle-foreground">
        {datum.line ? `${datum.date} · ${datum.line}` : datum.date}
      </span>
    </div>
  )
}

// Étiquette directe sur la seule barre la plus haute : le reste passe par l'axe et l'infobulle.
function peakLabel(peakIndex: number) {
  return function PeakLabel({ x, y, width, value, index }: LabelProps & { index?: number }) {
    if (index !== peakIndex || typeof x !== "number" || typeof y !== "number") return null
    const center = x + (typeof width === "number" ? width / 2 : 0)
    return (
      <text
        x={center}
        y={y - 8}
        textAnchor="middle"
        strokeWidth={4}
        strokeLinejoin="round"
        className="fill-foreground stroke-card text-xs font-medium tabular-nums [paint-order:stroke]"
      >
        {formatNumber(Number(value))}
      </text>
    )
  }
}

export function ImpressionsChart({ data }: { data: ImpressionsDatum[] }) {
  const dateById = new Map(data.map((datum) => [datum.id, datum.date]))
  const peakIndex = data.reduce(
    (best, datum, index) => (datum.impressions > data[best].impressions ? index : best),
    0
  )

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
      <BarChart
        accessibilityLayer
        title="Impressions par post"
        desc="Une barre par post publié, du plus ancien au plus récent. Le détail est dans le tableau des posts."
        data={data}
        margin={{ top: 24, right: 8, left: 0, bottom: 0 }}
      >
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="id"
          tickFormatter={(id: string) => dateById.get(id) ?? ""}
          tick={{ fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={12}
        />
        <YAxis
          tickFormatter={(value: number) => formatCompact(value)}
          tick={{ fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <ChartTooltip cursor={{ fill: "var(--accent)" }} content={PostTooltip} />
        <Bar
          dataKey="impressions"
          fill="var(--color-impressions)"
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
        >
          <LabelList dataKey="impressions" content={peakLabel(peakIndex)} />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
