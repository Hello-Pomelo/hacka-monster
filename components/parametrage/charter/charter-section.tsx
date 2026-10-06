import { Building2 } from "lucide-react"

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
import { formatDateTime } from "@/lib/parametrage/format"
import { getCharter } from "@/lib/parametrage/queries"
import type { CharterClient } from "@/lib/parametrage/types"

import { CharterForm } from "./charter-form"
import { ClientDialog } from "./client-dialog"
import { ClientsTable } from "./clients-table"

function ClientsCard({ clients }: { clients: CharterClient[] }) {
  const empty = clients.length === 0

  return (
    <Card className="ring-0">
      <CardHeader>
        <CardTitle>Clients</CardTitle>
        <CardDescription>
          Saisie manuelle par un admin : nom, alias et statut. Un client non citable bloque la
          programmation d&apos;un post qui le cite.
        </CardDescription>
        {!empty && (
          <CardAction>
            <ClientDialog mode="create" />
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {empty ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Building2 aria-hidden />
              </EmptyMedia>
              <EmptyTitle>Aucun client déclaré</EmptyTitle>
              <EmptyDescription>
                Aucun client déclaré dans la charte : les noms de clients ne sont pas vérifiés.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <ClientDialog mode="create" />
            </EmptyContent>
          </Empty>
        ) : (
          <ClientsTable clients={clients} />
        )}
      </CardContent>
    </Card>
  )
}

// Charte commune (spec Paramétrage, E1 étape 4 et onglet « Charte » de E2). Les erreurs de
// lecture remontent à l'error.tsx de la route.
export async function CharterSection({ variant }: { variant: "onboarding" | "settings" }) {
  const { charter, clients } = await getCharter()

  return (
    <section aria-labelledby="charter-title" className="grid min-w-0 gap-6">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="grid max-w-[720px] gap-1.5">
          <h2 id="charter-title" className="font-heading text-2xl">
            Charte commune
          </h2>
          <p className="text-muted-foreground">
            Ce qu&apos;on n&apos;a jamais le droit d&apos;écrire, commun à toutes les lignes. Tous les
            admins peuvent la modifier.
          </p>
        </div>
        {variant === "settings" && (
          <p className="text-xs text-subtle-foreground">
            Version {charter.version} · mise à jour le {formatDateTime(charter.updated_at)}
          </p>
        )}
      </header>
      <CharterForm charter={charter} />
      <ClientsCard clients={clients} />
    </section>
  )
}
