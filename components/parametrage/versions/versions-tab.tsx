import { Check, Minus, TriangleAlert, type LucideIcon } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateTime } from "@/lib/parametrage/format"
import { getCharter, getEditorialLines, getProfileNames } from "@/lib/parametrage/queries"
import {
  isEditableLineCode,
  isLineConfigured,
  parametrageHref,
  type EditorialLine,
} from "@/lib/parametrage/types"
import { cn } from "@/lib/utils"

type VersionState = "active" | "default" | "unconfigured"

const STATES: Record<VersionState, { label: string; className: string; icon: LucideIcon }> = {
  active: { label: "Active", className: "bg-success-surface text-success", icon: Check },
  default: { label: "Par défaut", className: "bg-chip text-chip-foreground", icon: Minus },
  unconfigured: {
    label: "Non configurée",
    className: "bg-warning-surface text-warning",
    icon: TriangleAlert,
  },
}

type VersionRow = {
  key: string
  label: string
  href: string | null
  version: number
  state: VersionState
  updatedAt: string
  updatedBy: string | null
}

function lineState(line: EditorialLine): VersionState {
  if (line.code === "neutre") return "default"
  return isLineConfigured(line) ? "active" : "unconfigured"
}

function StateBadge({ state }: { state: VersionState }) {
  const { label, className, icon: Icon } = STATES[state]
  return (
    <Badge
      variant="secondary"
      className={cn("h-[22px] text-[11px] tracking-[0.05em] uppercase", className)}
    >
      <Icon aria-hidden />
      {label}
    </Badge>
  )
}

// Auteur de la dernière mise à jour ; « — » quand il est inconnu ou illisible.
function AuthorCell({ name }: { name: string | undefined }) {
  return <TableCell className={cn(!name && "text-subtle-foreground")}>{name ?? "—"}</TableCell>
}

// Onglet Versions, au périmètre hackathon « v1 seule » : version courante de la charte et des lignes.
export async function VersionsTab() {
  const [{ charter }, lines] = await Promise.all([getCharter(), getEditorialLines()])

  const rows: VersionRow[] = [
    {
      key: "charter",
      label: "Charte commune",
      href: parametrageHref("charte"),
      version: charter.version,
      state: "active",
      updatedAt: charter.updated_at,
      updatedBy: charter.updated_by,
    },
    ...lines.map((line) => ({
      key: line.id,
      label: `Ligne ${line.name}`,
      href: isEditableLineCode(line.code) ? parametrageHref("lignes", { ligne: line.code }) : null,
      version: line.version,
      state: lineState(line),
      updatedAt: line.updated_at,
      updatedBy: line.updated_by,
    })),
  ]

  const names = await getProfileNames(
    rows.flatMap((row) => (row.updatedBy ? [row.updatedBy] : []))
  )

  return (
    <Card className="min-w-0 ring-0">
      <CardHeader>
        <CardTitle>Versions</CardTitle>
        <CardDescription>Version en vigueur de la charte et de chaque ligne éditoriale.</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Élément</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>État</TableHead>
              <TableHead>Mise à jour</TableHead>
              <TableHead>Par</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="font-medium">
                  {row.href ? (
                    <Link
                      href={row.href}
                      className="rounded-sm hover:text-link hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      {row.label}
                    </Link>
                  ) : (
                    row.label
                  )}
                </TableCell>
                <TableCell className="tabular-nums">v{row.version}</TableCell>
                <TableCell>
                  <StateBadge state={row.state} />
                </TableCell>
                <TableCell>{formatDateTime(row.updatedAt)}</TableCell>
                <AuthorCell name={row.updatedBy ? names[row.updatedBy] : undefined} />
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <p className="text-xs text-subtle-foreground">
          Seule la version 1 existe. L&apos;historique des versions, la comparaison avant / après et
          le bac à sable arrivent plus tard.
        </p>
      </CardContent>
    </Card>
  )
}
