import Link from "next/link"
import { PlugZap, TriangleAlert } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { CONNECTION_SETTINGS_HREF, CREATION_TEXTS, LINES_SETTINGS_HREF } from "@/lib/creation"

const BANNER_CLASS = "border-0 bg-warning-surface text-warning"
const DESCRIPTION_CLASS = "flex flex-wrap items-baseline gap-x-2 text-warning"
const LINK_CLASS = "font-medium text-link underline underline-offset-3"

// Aucune page LinkedIn connectée : la création reste possible, pas la programmation.
export function LinkedInMissingBanner() {
  return (
    <Alert className={BANNER_CLASS}>
      <PlugZap aria-hidden className="size-4" />
      <AlertDescription className={DESCRIPTION_CLASS}>
        <span>{CREATION_TEXTS.linkedinMissing}</span>
        <Link href={CONNECTION_SETTINGS_HREF} className={LINK_CLASS}>
          {CREATION_TEXTS.linkedinMissingLink}
        </Link>
      </AlertDescription>
    </Alert>
  )
}

// Ligne absente, Neutre ou pas encore configurée : les posts utilisent le ton neutre.
export function LineNotConfiguredBanner() {
  return (
    <Alert className={BANNER_CLASS}>
      <TriangleAlert aria-hidden className="size-4" />
      <AlertDescription className={DESCRIPTION_CLASS}>
        <span>{CREATION_TEXTS.lineNotConfigured}</span>
        <Link href={LINES_SETTINGS_HREF} className={LINK_CLASS}>
          {CREATION_TEXTS.lineNotConfiguredLink}
        </Link>
      </AlertDescription>
    </Alert>
  )
}
