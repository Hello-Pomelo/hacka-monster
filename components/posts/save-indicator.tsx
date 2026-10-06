import { Check, CircleAlert } from "lucide-react"

import type { AutosaveStatus } from "@/components/posts/use-autosave"
import { Spinner } from "@/components/ui/spinner"
import { CREATION_TEXTS } from "@/lib/creation"

// Indicateur discret de la sauvegarde automatique, en tête de l'éditeur.
export function SaveIndicator({ status }: { status: AutosaveStatus }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex min-h-5 items-center gap-1.5 text-xs text-subtle-foreground"
    >
      {status === "saving" && (
        <>
          <Spinner aria-hidden className="size-3.5" />
          {CREATION_TEXTS.saving}
        </>
      )}
      {status === "saved" && (
        <>
          <Check aria-hidden className="size-3.5" />
          {CREATION_TEXTS.saved}
        </>
      )}
      {status === "error" && (
        <span className="inline-flex items-center gap-1.5 text-destructive">
          <CircleAlert aria-hidden className="size-3.5" />
          {CREATION_TEXTS.saveFailed}
        </span>
      )}
    </span>
  )
}
