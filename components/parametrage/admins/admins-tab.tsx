import { ShieldCheck, User, Users } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getAdmins } from "@/lib/parametrage/queries"
import { parametrageHref, type AdminRow } from "@/lib/parametrage/types"
import { requireProfile } from "@/lib/supabase/auth"
import { cn } from "@/lib/utils"

const BADGE_CLASS = "h-[22px] text-[11px] tracking-[0.05em] uppercase"

function RoleBadge({ role }: { role: AdminRow["role"] }) {
  if (role === "admin") {
    return (
      <Badge variant="secondary" className={cn(BADGE_CLASS, "bg-chip text-chip-foreground")}>
        <ShieldCheck aria-hidden />
        Admin
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className={cn(BADGE_CLASS, "text-muted-foreground")}>
      <User aria-hidden />
      Contributeur
    </Badge>
  )
}

// Onglet Admins, au périmètre hackathon « Admins créés en base » : liste en lecture seule (US6 plus tard).
export async function AdminsTab() {
  const [profile, admins] = await Promise.all([requireProfile(), getAdmins()])

  return (
    <Card className="min-w-0 ring-0">
      <CardHeader>
        <CardTitle>Admins</CardTitle>
        <CardDescription>
          Les admins sont créés en base. Chaque admin modifie la ligne de son équipe ; tous les
          admins modifient la charte.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {admins.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>Aucun admin</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Ligne</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => {
                const isMe = admin.id === profile.id
                return (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 font-medium">
                        {admin.nom}
                        {isMe && (
                          <Badge
                            variant="outline"
                            className={cn(
                              BADGE_CLASS,
                              "border-tag-border bg-tag text-tag-foreground"
                            )}
                          >
                            Vous
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={admin.role} />
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-3">
                        <span className={cn(!admin.lineName && "text-subtle-foreground")}>
                          {admin.lineName ?? "Aucune ligne"}
                        </span>
                        {isMe && (
                          <Link
                            href={parametrageHref("lignes")}
                            className="rounded-sm text-link hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          >
                            Changer de ligne
                          </Link>
                        )}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
