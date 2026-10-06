import { Check } from "lucide-react"

import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

import type { AutosaveState } from "./use-autosave"

// Indicateur discret de l'enregistrement automatique (spec Paramétrage, US1).
export function SaveIndicator({ state }: { state: AutosaveState }) {
  return (
    <p
      aria-live="polite"
      className={cn(
        "flex min-h-4 items-center gap-1.5 text-xs text-subtle-foreground",
        state === "error" && "text-destructive"
      )}
    >
      {state === "saving" && (
        <>
          <Spinner aria-hidden="true" className="size-3.5" />
          Enregistrement…
        </>
      )}
      {state === "saved" && (
        <>
          <Check aria-hidden="true" className="size-3.5" />
          Enregistré
        </>
      )}
      {state === "error" && "Non enregistré"}
    </p>
  )
}
