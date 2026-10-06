import Link from "next/link"
import { Files, ImageIcon, Plus } from "lucide-react"

import { NewPostButton } from "@/components/posts/new-post-button"
import { StatusBadge } from "@/components/posts/status-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CREATION_TEXTS, seriesLabel } from "@/lib/creation"
import type { PostListRow } from "@/lib/creation-data"
import { postTitle } from "@/lib/posts"
import { formatPlannedDateShort, isoToParis, todayInParis } from "@/lib/series"
import { cn } from "@/lib/utils"

const DATE_SEPARATOR = " · "

// Date affichée : publication réelle pour un post Publié, sinon date prévue (même règle que le tri).
function rowDate(row: PostListRow): string | null {
  return row.status === "published" ? (row.published_at ?? row.scheduled_at) : row.scheduled_at
}

// « jeu. 8 oct. · 10 h 30 », avec l'année quand elle diffère de l'année en cours (posts importés).
function dateLabel(iso: string, currentYear: string): string {
  const { day, time } = isoToParis(iso)
  const label = formatPlannedDateShort(day, time)
  const year = day.slice(0, 4)
  if (year === currentYear) return label
  const index = label.indexOf(DATE_SEPARATOR)
  return index < 0 ? `${label} ${year}` : `${label.slice(0, index)} ${year}${label.slice(index)}`
}

const HEAD_CLASS = "h-10 px-4 text-xs font-medium tracking-[0.05em] text-subtle-foreground uppercase"

function EmptyCell({ label }: { label: string }) {
  return (
    <>
      <span aria-hidden className="text-subtle-foreground">
        —
      </span>
      <span className="sr-only">{label}</span>
    </>
  )
}

function PostRow({ row, currentYear }: { row: PostListRow; currentYear: string }) {
  const date = rowDate(row)
  const series = seriesLabel(row, row.seriesSubject)

  return (
    <TableRow className="group/row relative hover:bg-accent">
      <TableCell className="px-4 py-3 tabular-nums">
        {date ? (
          <time dateTime={date} className="block first-letter:uppercase">
            {dateLabel(date, currentYear)}
          </time>
        ) : (
          <span className="text-subtle-foreground">Non planifiée</span>
        )}
      </TableCell>
      <TableCell className="px-4 py-3">
        <StatusBadge post={row} />
      </TableCell>
      <TableCell className="w-full min-w-[260px] px-4 py-3 whitespace-normal">
        {/* Lien étendu à toute la ligne : un clic n'importe où ouvre le post (E3). */}
        <Link
          href={`/posts/${row.id}`}
          className="font-medium outline-none group-hover/row:text-link after:absolute after:inset-0 focus-visible:after:ring-3 focus-visible:after:ring-ring/50 focus-visible:after:ring-inset"
        >
          {postTitle(row, 80)}
        </Link>
        {row.status === "failed" && (
          <p className="mt-0.5 line-clamp-1 text-xs text-destructive">
            {row.failure_reason ?? "La publication a échoué."}
          </p>
        )}
      </TableCell>
      <TableCell className="px-4 py-3 text-muted-foreground">
        <span className="block max-w-[220px] truncate">
          {series}
        </span>
      </TableCell>
      <TableCell className="px-4 py-3 text-muted-foreground">
        {row.lineName ?? <EmptyCell label="Aucune ligne" />}
      </TableCell>
      <TableCell className="px-4 py-3 text-center">
        {row.image_path ? (
          <>
            <ImageIcon aria-hidden className="inline size-4 align-middle text-muted-foreground" />
            <span className="sr-only">Avec image</span>
          </>
        ) : (
          <EmptyCell label="Sans image" />
        )}
      </TableCell>
    </TableRow>
  )
}

type PostsTableProps = {
  rows: PostListRow[]
  // Un filtre de statut ou de ligne est actif.
  filtered: boolean
}

// Tableau « Tous les posts » (E6), lignes déjà triées par `listPosts`.
export function PostsTable({ rows, filtered }: PostsTableProps) {
  if (rows.length === 0) {
    return filtered ? (
      <Empty className="rounded-xl bg-card">
        <EmptyHeader>
          <EmptyDescription>Aucun post ne correspond à ces filtres.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="secondary" nativeButton={false} render={<Link href="/posts" scroll={false} />}>
            Effacer les filtres
          </Button>
        </EmptyContent>
      </Empty>
    ) : (
      <Empty className="rounded-xl bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Files aria-hidden />
          </EmptyMedia>
          <EmptyTitle>{CREATION_TEXTS.emptyList}</EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <NewPostButton className="h-10 gap-2 px-4">
            <Plus aria-hidden className="size-4" />
            Nouveau post
          </NewPostButton>
        </EmptyContent>
      </Empty>
    )
  }

  const currentYear = todayInParis().slice(0, 4)

  return (
    <Card className="gap-0 overflow-hidden p-0 ring-0">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={HEAD_CLASS}>Date</TableHead>
            <TableHead className={HEAD_CLASS}>Statut</TableHead>
            <TableHead className={HEAD_CLASS}>Extrait</TableHead>
            <TableHead className={HEAD_CLASS}>Série</TableHead>
            <TableHead className={HEAD_CLASS}>Ligne</TableHead>
            <TableHead className={cn(HEAD_CLASS, "text-center")}>Image</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <PostRow key={row.id} row={row} currentYear={currentYear} />
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
