"use client"

import { useId } from "react"

import { LineNotConfiguredBanner } from "@/components/posts/creation-banners"
import { Card } from "@/components/ui/card"
import { FieldError } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { isLineConfigured, type LineOption } from "@/lib/creation"

type SeriesLineSectionProps = {
  lines: LineOption[]
  lineId: string | null
  // Erreur renvoyée par le serveur sur la ligne.
  error: string | null
  disabled: boolean
  onChange: (lineId: string) => void
}

// Bloc « Ligne éditoriale » de E2 : Marketing, RH ou Neutre. Une ligne absente, Neutre ou pas encore
// configurée affiche le bandeau du ton neutre (spec Création de post, messages).
export function SeriesLineSection({ lines, lineId, error, disabled, onChange }: SeriesLineSectionProps) {
  const titleId = useId()
  const selected = lines.find((line) => line.id === lineId) ?? null

  return (
    <Card className="gap-4 p-5 ring-0">
      <h2 id={titleId} className="font-heading text-lg">
        Ligne éditoriale
      </h2>

      {lines.length > 0 ? (
        <ToggleGroup
          aria-labelledby={titleId}
          variant="outline"
          value={lineId ? [lineId] : []}
          onValueChange={(value) => value[0] && onChange(value[0])}
          disabled={disabled}
        >
          {lines.map((line) => (
            <ToggleGroupItem
              key={line.id}
              value={line.id}
              className="h-10 px-4 aria-pressed:border-primary aria-pressed:bg-tag aria-pressed:text-tag-foreground"
            >
              {line.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ) : (
        <p className="text-sm text-subtle-foreground">Aucune ligne éditoriale n&apos;est disponible.</p>
      )}

      {!isLineConfigured(selected) && <LineNotConfiguredBanner />}
      <FieldError>{error}</FieldError>
    </Card>
  )
}
