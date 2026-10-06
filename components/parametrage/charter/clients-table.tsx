"use client"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CharterClient } from "@/lib/parametrage/types"
import { cn } from "@/lib/utils"

import { ClientDialog } from "./client-dialog"
import { ClientStatusBadge } from "./client-status-badge"
import { DeleteClientButton } from "./delete-client-button"

const HEAD = "text-xs font-medium tracking-[0.06em] text-subtle-foreground uppercase"

// Clients déclarés dans la charte, avec leurs alias et leur statut (spec Paramétrage, US4).
export function ClientsTable({ clients }: { clients: CharterClient[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className={HEAD}>Client</TableHead>
          <TableHead className={HEAD}>Alias</TableHead>
          <TableHead className={HEAD}>Statut</TableHead>
          <TableHead className={cn(HEAD, "w-0")}>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell className="font-medium break-words whitespace-normal">{client.name}</TableCell>
            <TableCell className="whitespace-normal">
              {client.aliases.length > 0 ? (
                <ul aria-label={`Alias de ${client.name}`} className="flex flex-wrap gap-1">
                  {client.aliases.map((alias, index) => (
                    <li key={`${index}-${alias}`} className="max-w-full">
                      <Badge
                        variant="secondary"
                        className="h-auto min-h-5 max-w-full bg-chip break-words whitespace-normal text-chip-foreground"
                      >
                        {alias}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-subtle-foreground">Aucun alias</span>
              )}
            </TableCell>
            <TableCell>
              <ClientStatusBadge status={client.status} />
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <ClientDialog mode="edit" client={client} />
                <DeleteClientButton client={client} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
