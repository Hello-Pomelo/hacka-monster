import { Minus, TrendingDown, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"

export type DeltaValue =
  // Sens à la précision affichée, et texte déjà formaté (« +12 % »).
  | { direction: -1 | 0 | 1; text: string }
  // Pas de comparaison possible : raison affichée à la place.
  | { unavailable: string }

// Évolution par rapport à la période précédente : icône + texte, jamais la couleur seule.
export function Delta({ value, comparisonLabel }: { value: DeltaValue; comparisonLabel: string }) {
  if ("unavailable" in value) {
    return <span className="text-xs text-subtle-foreground">{value.unavailable}</span>
  }

  const { direction, text } = value
  const Icon = direction > 0 ? TrendingUp : direction < 0 ? TrendingDown : Minus

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        direction > 0 && "text-success",
        direction < 0 && "text-destructive",
        direction === 0 && "text-subtle-foreground"
      )}
    >
      <Icon className="size-4" aria-hidden />
      <span>
        <span className="font-medium">{text}</span> {comparisonLabel}
      </span>
    </span>
  )
}
