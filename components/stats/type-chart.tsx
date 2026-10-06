"use client"

import {
  Bar,
  BarChart,
  LabelList,
  XAxis,
  YAxis,
  type TooltipContentProps,
  type TooltipValueType,
} from "recharts"

import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatNumber, formatPercent } from "@/lib/stats/format"

export type TypeDatum = {
  type: string
  label: string
  rate: number
  posts: number
  averageImpressions: number
}

const chartConfig = {
  rate: { label: "Taux d'interaction", color: "var(--chart-1)" },
} satisfies ChartConfig

const ROW_HEIGHT = 44

function TypeTooltip({ active, payload }: TooltipContentProps<TooltipValueType, string | number>) {
  const datum = payload?.[0]?.payload as TypeDatum | undefined
  if (!active || !datum) return null

  return (
    <div className="grid gap-1 rounded-lg border bg-background px-3 py-2 text-xs shadow-float">
      <span className="flex items-center gap-2 text-sm font-medium">
        <span className="h-0.5 w-3 shrink-0 rounded-full bg-(--color-rate)" aria-hidden />
        {formatPercent(datum.rate)}
      </span>
      <span className="text-muted-foreground">{datum.label}</span>
      <span className="text-subtle-foreground">
        {formatNumber(datum.posts)} {datum.posts > 1 ? "posts" : "post"} ·{" "}
        {formatNumber(datum.averageImpressions)} impressions en moyenne
      </span>
    </div>
  )
}

// Types de post classés du meilleur taux d'interaction au moins bon (une seule série : une couleur).
export function TypeChart({ data }: { data: TypeDatum[] }) {
  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto w-full"
      style={{ height: data.length * ROW_HEIGHT }}
    >
      <BarChart
        accessibilityLayer
        title="Taux d'interaction par type de post"
        desc="Types de post classés du meilleur taux d'interaction au moins bon. Valeurs dans l'onglet Tableau."
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 56, left: 0, bottom: 0 }}
      >
        <XAxis type="number" dataKey="rate" hide domain={[0, "dataMax"]} />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          width={172}
          tick={{ fill: "var(--foreground)" }}
        />
        <ChartTooltip cursor={{ fill: "var(--accent)" }} content={TypeTooltip} />
        <Bar dataKey="rate" fill="var(--color-rate)" radius={[0, 4, 4, 0]} maxBarSize={24}>
          <LabelList
            dataKey="rate"
            position="right"
            offset={8}
            formatter={(value) => formatPercent(Number(value))}
            className="fill-foreground text-xs"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

// Même données en tableau (lecture sans survol, lecteurs d'écran).
export function TypeTable({ data }: { data: TypeDatum[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type de post</TableHead>
          <TableHead className="text-right">Posts</TableHead>
          <TableHead className="text-right">Impressions moyennes</TableHead>
          <TableHead className="text-right">Taux d&apos;interaction</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((datum) => (
          <TableRow key={datum.type}>
            <TableCell>{datum.label}</TableCell>
            <TableCell className="text-right tabular-nums">{formatNumber(datum.posts)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(datum.averageImpressions)}
            </TableCell>
            <TableCell className="text-right">{formatPercent(datum.rate)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
