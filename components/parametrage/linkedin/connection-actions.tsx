import type { ComponentProps, ReactNode } from "react"
import { ArrowLeftRight, Link2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ConnectionState } from "@/lib/linkedin/types"
import { cn } from "@/lib/utils"

import { DisconnectButton } from "./disconnect-button"
import { ReimportButton } from "./reimport-button"

// Point d'entrée de l'OAuth LinkedIn ; `next` ramène sur l'écran d'origine pour choisir la page.
export function linkedInConnectHref(returnTo: string): string {
  return `/api/linkedin/login?next=${encodeURIComponent(returnTo)}`
}

type ConnectButtonProps = {
  href: string
  variant?: ComponentProps<typeof Button>["variant"]
  className?: string
  children: ReactNode
}

// Lien `<a>` et non `next/link` : la route redirige vers LinkedIn, elle ne doit être ni préchargée
// ni suivie par le routeur client.
export function ConnectButton({ href, variant, className, children }: ConnectButtonProps) {
  return (
    <Button
      variant={variant}
      className={cn("h-10 px-4", className)}
      nativeButton={false}
      render={<a href={href} />}
    >
      {children}
    </Button>
  )
}

type ConnectionActionsProps = {
  state: ConnectionState
  connectHref: string
  scheduledCount: number
}

// Actions de l'onglet Connexion LinkedIn (spec Création de post, E7).
export function ConnectionActions({ state, connectHref, scheduledCount }: ConnectionActionsProps) {
  return (
    <div className="flex flex-wrap items-start gap-2 border-t pt-4">
      {state === "disconnected" && (
        <ConnectButton href={connectHref}>
          <Link2 aria-hidden="true" />
          Connecter
        </ConnectButton>
      )}

      {state === "expired" && (
        <>
          <ConnectButton href={connectHref}>
            <Link2 aria-hidden="true" />
            Reconnecter
          </ConnectButton>
          <DisconnectButton scheduledCount={scheduledCount} />
        </>
      )}

      {(state === "connected" || state === "expiring" || state === "demo") && (
        <>
          <ConnectButton href={connectHref} variant="secondary">
            <ArrowLeftRight aria-hidden="true" />
            Changer de page
          </ConnectButton>
          <ReimportButton />
          <DisconnectButton scheduledCount={scheduledCount} />
        </>
      )}
    </div>
  )
}
