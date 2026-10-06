import type { ReactNode } from "react"
import {
  Check,
  CircleCheck,
  Clock,
  FlaskConical,
  Link2,
  TriangleAlert,
  Unplug,
  type LucideIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { badgeVariants } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  LINKEDIN_ERROR_MESSAGES,
  type ConnectionState,
  type LinkedInConnectionView,
} from "@/lib/linkedin/types"
import { formatDateTime, formatShortDate } from "@/lib/parametrage/format"
import { cn } from "@/lib/utils"

import { ConnectButton } from "./connection-actions"
import { PageAvatar } from "./page-choice-form"
import { ReimportButton } from "./reimport-button"

const STATE_BADGES: Record<
  ConnectionState,
  { variant: "outline" | "secondary"; className: string; icon: LucideIcon; label: string }
> = {
  disconnected: { variant: "outline", className: "text-muted-foreground", icon: Unplug, label: "Non connectée" },
  connected: { variant: "secondary", className: "bg-success-surface text-success", icon: Check, label: "Connectée" },
  expiring: { variant: "secondary", className: "bg-warning-surface text-warning", icon: Clock, label: "Expire bientôt" },
  expired: { variant: "outline", className: "border-destructive text-destructive", icon: TriangleAlert, label: "Expirée" },
  demo: { variant: "secondary", className: "bg-warning-surface text-warning", icon: FlaskConical, label: "Simulée (mode démo)" },
}

const DEMO_NOTICE =
  "Connexion simulée : LinkedIn n'est pas configuré sur le serveur. Les posts importés sont fictifs et rien n'est publié sur LinkedIn."
const DEMO_MODE_HINT = "Mode démo : LinkedIn n'est pas configuré sur le serveur, la connexion sera simulée."

// Badge rendu en `span` : le composant `Badge` (Base UI) ne s'exécute pas dans un Server Component.
function StateBadge({ state, expiresAt }: { state: ConnectionState; expiresAt: string | null }) {
  const { variant, className, icon: Icon, label } = STATE_BADGES[state]
  return (
    <span
      className={cn(
        badgeVariants({ variant }),
        "h-[22px] text-[11px] tracking-[0.05em] uppercase",
        className
      )}
    >
      <Icon aria-hidden="true" />
      {state === "expiring" && expiresAt ? `Expire le ${formatShortDate(expiresAt)}` : label}
    </span>
  )
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs tracking-[0.06em] text-subtle-foreground uppercase">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function ConnectionDetails({ connection }: { connection: LinkedInConnectionView }) {
  const page = { name: connection.targetName, logoUrl: connection.targetLogoUrl }
  let expiry = "Non communiquée par LinkedIn"
  if (connection.expiresAt) expiry = formatDateTime(connection.expiresAt)
  else if (connection.mode === "demo") expiry = "Sans expiration (mode démo)"

  return (
    <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2">
      <Detail label="Page cible">
        <span className="flex items-center gap-2">
          <PageAvatar page={page} size="sm" />
          <span className="min-w-0 truncate font-medium">{connection.targetName}</span>
        </span>
      </Detail>
      <Detail label="Compte administrateur">{connection.adminName ?? "Inconnu"}</Detail>
      <Detail label="Expiration de la connexion">{expiry}</Detail>
      <Detail label="Dernier import des posts">
        {connection.lastImportAt ? formatDateTime(connection.lastImportAt) : "Jamais"}
      </Detail>
    </dl>
  )
}

function StateAlert({ state }: { state: ConnectionState }) {
  if (state === "demo") {
    return (
      <Alert className="border-transparent bg-chip text-chip-foreground">
        <FlaskConical aria-hidden="true" />
        <AlertDescription className="text-chip-foreground">{DEMO_NOTICE}</AlertDescription>
      </Alert>
    )
  }
  if (state === "expired") {
    return (
      <Alert variant="destructive" className="border-destructive">
        <TriangleAlert aria-hidden="true" />
        <AlertTitle>{LINKEDIN_ERROR_MESSAGES.expired}</AlertTitle>
      </Alert>
    )
  }
  return null
}

type ConnectionSummaryProps = {
  connection: LinkedInConnectionView | null
  state: ConnectionState
  variant: "onboarding" | "settings"
  connectHref: string
  demoMode: boolean
  // Actions de l'onglet de réglages, sous le détail de la connexion.
  children?: ReactNode
}

// État de la connexion à la page LinkedIn (spec Paramétrage E0, spec Création de post E7).
export function ConnectionSummary(props: ConnectionSummaryProps) {
  return props.variant === "settings" ? <SettingsSummary {...props} /> : <OnboardingSummary {...props} />
}

function SettingsSummary({ connection, state, demoMode, children }: ConnectionSummaryProps) {
  return (
    <Card className="ring-0">
      <CardHeader>
        <CardTitle role="heading" aria-level={2} className="text-lg">
          Connexion de la page LinkedIn
        </CardTitle>
        <CardDescription>
          Une seule connexion sert à importer les posts de la page et à publier les posts programmés.
        </CardDescription>
        <CardAction>
          <StateBadge state={state} expiresAt={connection?.expiresAt ?? null} />
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-5">
        <StateAlert state={state} />
        {connection ? (
          <ConnectionDetails connection={connection} />
        ) : (
          <div className="grid gap-1">
            <p className="text-muted-foreground">
              Aucune page connectée. La programmation reste impossible tant que la page n&apos;est pas
              connectée.
            </p>
            {demoMode && <p className="text-xs text-subtle-foreground">{DEMO_MODE_HINT}</p>}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  )
}

function OnboardingSummary({ connection, state, connectHref, demoMode }: ConnectionSummaryProps) {
  if (!connection) {
    return (
      <Card className="ring-0">
        <CardContent className="grid justify-items-start gap-4">
          <div className="grid gap-2">
            <h2 className="font-heading text-2xl">Connectez la page LinkedIn</h2>
            <p className="max-w-[640px] text-muted-foreground">
              Connectez la page LinkedIn de l&apos;entreprise pour que l&apos;outil apprenne de vos
              posts et puisse publier à votre place.
            </p>
          </div>
          <ConnectButton href={connectHref}>
            <Link2 aria-hidden="true" />
            Connecter la page LinkedIn
          </ConnectButton>
          {demoMode && <p className="text-xs text-subtle-foreground">{DEMO_MODE_HINT}</p>}
        </CardContent>
      </Card>
    )
  }

  if (state === "expired") {
    return (
      <Card className="ring-0">
        <CardContent className="grid justify-items-start gap-4">
          <StateAlert state={state} />
          <ConnectButton href={connectHref}>
            <Link2 aria-hidden="true" />
            Reconnecter la page LinkedIn
          </ConnectButton>
        </CardContent>
      </Card>
    )
  }

  const page = { name: connection.targetName, logoUrl: connection.targetLogoUrl }
  return (
    <Card className="ring-0">
      <CardContent className="grid justify-items-start gap-4">
        <div className="flex w-full flex-wrap items-center gap-3 rounded-xl bg-success-surface p-4">
          <CircleCheck aria-hidden="true" className="size-4 shrink-0 text-success" />
          <PageAvatar page={page} />
          <div className="grid min-w-0 flex-1 gap-0.5">
            <p className="font-medium text-success">Page connectée : {connection.targetName}</p>
            <p className="text-sm text-muted-foreground">
              {connection.lastImportAt
                ? `Dernier import : ${formatDateTime(connection.lastImportAt)}`
                : "Aucun post importé pour l'instant."}
            </p>
          </div>
          {state !== "connected" && <StateBadge state={state} expiresAt={connection.expiresAt} />}
        </div>
        {state === "demo" && (
          <p className="text-xs text-subtle-foreground">
            Mode démo : la connexion est simulée, les posts importés sont fictifs.
          </p>
        )}
        <ReimportButton />
      </CardContent>
    </Card>
  )
}
