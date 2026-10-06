"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatNumber, formatPercent } from "@/lib/stats/format"
import { cn } from "@/lib/utils"

// Ligne du tableau, préparée côté serveur (libellés formatés, valeurs nulles sans relevé).
export type PostTableRow = {
  id: string
  publishedAt: string
  date: string
  title: string
  typeLabel: string
  lineName: string | null
  authorName: string
  impressions: number | null
  reactions: number | null
  comments: number | null
  reposts: number | null
  clicks: number | null
  rate: number | null
}

type MetricKey = "impressions" | "reactions" | "comments" | "reposts" | "clicks" | "rate"
type SortKey = "publishedAt" | MetricKey
type Sort = { key: SortKey; direction: "asc" | "desc" }

const METRIC_COLUMNS: { key: MetricKey; label: string }[] = [
  { key: "impressions", label: "Impressions" },
  { key: "reactions", label: "Réactions" },
  { key: "comments", label: "Commentaires" },
  { key: "reposts", label: "Republications" },
  { key: "clicks", label: "Clics" },
  { key: "rate", label: "Taux d'interaction" },
]

const NO_CAPTURE = "Pas encore de relevé LinkedIn"

// Les valeurs manquantes (« n.d. ») restent en fin de liste, quel que soit le sens.
function compareRows(a: PostTableRow, b: PostTableRow, { key, direction }: Sort): number {
  const sign = direction === "asc" ? 1 : -1
  if (key === "publishedAt") return sign * (Date.parse(a.publishedAt) - Date.parse(b.publishedAt))
  const left = a[key]
  const right = b[key]
  if (left === null || right === null) return left === right ? 0 : left === null ? 1 : -1
  return sign * (left - right)
}

function SortHeader({
  label,
  sort,
  sortKey,
  onSort,
  align = "left",
}: {
  label: string
  sort: Sort
  sortKey: SortKey
  onSort: (key: SortKey) => void
  align?: "left" | "right"
}) {
  const active = sort.key === sortKey
  const Icon = !active ? ArrowUpDown : sort.direction === "asc" ? ArrowUp : ArrowDown
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSort(sortKey)}
      className={cn(
        "h-7 gap-1 px-2 font-medium",
        align === "left" ? "-ml-2" : "-mr-2 flex-row-reverse",
        active ? "text-foreground" : "text-muted-foreground"
      )}
    >
      {label}
      <Icon className={cn("size-3.5", !active && "text-subtle-foreground")} aria-hidden />
    </Button>
  )
}

function MetricCell({
  value,
  format,
  missingTitle,
  tabular = true,
}: {
  value: number | null
  format: (value: number) => string
  missingTitle: string
  // Chiffres à chasse fixe pour aligner les entiers ; pas pour un pourcentage (virgule élargie).
  tabular?: boolean
}) {
  return (
    <TableCell className={cn("text-right", tabular && value !== null && "tabular-nums")}>
      {value === null ? (
        <span className="text-subtle-foreground" title={missingTitle}>
          n.d.
        </span>
      ) : (
        format(value)
      )}
    </TableCell>
  )
}

export function PostsTable({ rows, labelledBy }: { rows: PostTableRow[]; labelledBy: string }) {
  const [sort, setSort] = useState<Sort>({ key: "publishedAt", direction: "desc" })
  const sorted = rows.toSorted((a, b) => compareRows(a, b, sort))

  function toggleSort(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "desc" }
    )
  }

  const ariaSort = (key: SortKey) =>
    sort.key === key ? (sort.direction === "asc" ? "ascending" : "descending") : "none"

  return (
    <Table aria-labelledby={labelledBy}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead aria-sort={ariaSort("publishedAt")}>
            <SortHeader label="Publié le" sort={sort} sortKey="publishedAt" onSort={toggleSort} />
          </TableHead>
          <TableHead>Post</TableHead>
          {METRIC_COLUMNS.map((column) => (
            <TableHead key={column.key} className="text-right" aria-sort={ariaSort(column.key)}>
              <SortHeader
                label={column.label}
                sort={sort}
                sortKey={column.key}
                onSort={toggleSort}
                align="right"
              />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => {
          const noMetrics = row.impressions === null
          return (
            <TableRow key={row.id}>
              <TableCell className="text-muted-foreground">{row.date}</TableCell>
              <TableCell className="max-w-96 min-w-64 whitespace-normal">
                <div className="grid gap-1">
                  <span className="line-clamp-2 font-medium">{row.title}</span>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-subtle-foreground">
                    {[row.typeLabel, row.lineName, row.authorName].filter(Boolean).join(" · ")}
                    {noMetrics && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Pas encore de relevé
                      </Badge>
                    )}
                  </span>
                </div>
              </TableCell>
              <MetricCell value={row.impressions} format={formatNumber} missingTitle={NO_CAPTURE} />
              <MetricCell value={row.reactions} format={formatNumber} missingTitle={NO_CAPTURE} />
              <MetricCell value={row.comments} format={formatNumber} missingTitle={NO_CAPTURE} />
              <MetricCell value={row.reposts} format={formatNumber} missingTitle={NO_CAPTURE} />
              <MetricCell
                value={row.clicks}
                format={formatNumber}
                missingTitle={noMetrics ? NO_CAPTURE : "Clics non fournis par LinkedIn pour ce post"}
              />
              <MetricCell
                value={row.rate}
                format={formatPercent}
                missingTitle={noMetrics ? NO_CAPTURE : "Aucune impression pour l'instant"}
                tabular={false}
              />
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
