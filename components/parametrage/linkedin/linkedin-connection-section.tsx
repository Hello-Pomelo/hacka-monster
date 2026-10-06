import type { ReactNode } from "react"
import Link from "next/link"
import { ClipboardPaste, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { isLinkedInDemoMode } from "@/lib/linkedin/config"
import { getLinkedInConnection } from "@/lib/linkedin/connection"
import { getPageChoices } from "@/lib/linkedin/oauth"
import {
  LINKEDIN_ERROR_MESSAGES,
  connectionState,
  parseLinkedInParam,
  type LinkedInErrorCode,
} from "@/lib/linkedin/types"
import { countScheduledPosts } from "@/lib/parametrage/queries"

import { ConnectButton, ConnectionActions, linkedInConnectHref } from "./connection-actions"
import { ConnectionSummary } from "./connection-summary"
import { LinkedInNotice } from "./linkedin-notice"
import { PageChoiceForm } from "./page-choice-form"

// Erreurs après lesquelles l'onboarding continue avec des posts collés (spec Paramétrage, E0).
const MANUAL_FALLBACK_CODES: readonly LinkedInErrorCode[] = ["refused", "no_page", "api_denied"]
const MANUAL_FALLBACK_HINT =
  "Vous pouvez continuer avec des posts collés à la main : la programmation restera impossible tant que la page n'est pas connectée."

type ErrorNoticeProps = {
  code: LinkedInErrorCode
  connectHref: string
  manualFallbackHref: string
}

function ConnectionErrorNotice({ code, connectHref, manualFallbackHref }: ErrorNoticeProps) {
  return (
    <LinkedInNotice
      message={LINKEDIN_ERROR_MESSAGES[code]}
      hint={MANUAL_FALLBACK_CODES.includes(code) ? MANUAL_FALLBACK_HINT : undefined}
    >
      <ConnectButton href={connectHref}>
        <RefreshCw aria-hidden="true" />
        Réessayer
      </ConnectButton>
      <Button
        variant="secondary"
        className="h-10 px-4"
        nativeButton={false}
        render={<Link href={manualFallbackHref} />}
      >
        <ClipboardPaste aria-hidden="true" />
        Coller mes posts à la main
      </Button>
    </LinkedInNotice>
  )
}

type LinkedInConnectionSectionProps = {
  variant: "onboarding" | "settings"
  // Écran où revenir après l'OAuth : « /onboarding?etape=connexion » ou « /parametrage?onglet=connexion ».
  returnTo: string
  // Paramètre d'URL `linkedin` posé au retour de l'OAuth : « choose » ou un code d'erreur.
  linkedinParam: string | undefined
  // Écran de collage manuel des posts de référence.
  manualFallbackHref: string
}

// Connexion de la page LinkedIn, partagée par l'onboarding (spec Paramétrage, E0)
// et l'onglet Connexion LinkedIn du paramétrage (spec Création de post, E7).
export async function LinkedInConnectionSection({
  variant,
  returnTo,
  linkedinParam,
  manualFallbackHref,
}: LinkedInConnectionSectionProps) {
  const param = parseLinkedInParam(linkedinParam)
  const connectHref = linkedInConnectHref(returnTo)
  const demoMode = isLinkedInDemoMode()

  let notice: ReactNode = null

  if (param === "choose") {
    const pages = await getPageChoices()
    if (pages && pages.length > 0) {
      return <PageChoiceForm pages={pages} returnTo={returnTo} demo={demoMode} />
    }
    notice = pages ? (
      <ConnectionErrorNotice
        code="no_page"
        connectHref={connectHref}
        manualFallbackHref={manualFallbackHref}
      />
    ) : (
      <LinkedInNotice message="La connexion a expiré. Recommencez.">
        <ConnectButton href={connectHref}>
          <RefreshCw aria-hidden="true" />
          Recommencer
        </ConnectButton>
      </LinkedInNotice>
    )
  } else if (param) {
    notice = (
      <ConnectionErrorNotice
        code={param}
        connectHref={connectHref}
        manualFallbackHref={manualFallbackHref}
      />
    )
  }

  // Onboarding : l'erreur remplace l'étape, qui propose déjà de continuer sans connexion.
  if (notice && variant === "onboarding") return notice

  // Réglages : l'erreur s'affiche au-dessus de l'état de la connexion, qui reste consultable.
  const [connection, scheduledCount] = await Promise.all([
    getLinkedInConnection(),
    variant === "settings" ? countScheduledPosts() : Promise.resolve(0),
  ])
  const state = connectionState(connection)

  return (
    <div className="grid gap-4">
      {notice}
      <ConnectionSummary
        connection={connection}
        state={state}
        variant={variant}
        connectHref={connectHref}
        demoMode={demoMode}
      >
        {variant === "settings" && (
          <ConnectionActions state={state} connectHref={connectHref} scheduledCount={scheduledCount} />
        )}
      </ConnectionSummary>
    </div>
  )
}
