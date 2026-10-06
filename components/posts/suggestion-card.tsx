"use client"

import { CalendarDays, PencilLine, X } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

import { dismissSuggestion, restoreSuggestion } from "@/app/(app)/ideas/actions"
import { NewPostButton } from "@/components/posts/new-post-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatDayLong, REASON_LABELS, type Suggestion } from "@/lib/suggestions"

type SuggestionCardProps = {
  suggestion: Suggestion
  lineName: string
}

export function SuggestionCard({ suggestion, lineName }: SuggestionCardProps) {
  const [pending, startTransition] = useTransition()

  // Appelée depuis le toast, après le démontage de la carte : pas de transition locale.
  async function restore() {
    const result = await restoreSuggestion(suggestion.key)
    if (!result.ok) toast.error(result.error)
  }

  function dismiss() {
    startTransition(async () => {
      const result = await dismissSuggestion(suggestion.key)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast("Suggestion ignorée.", {
        duration: 5000,
        action: { label: "Annuler", onClick: restore },
      })
    })
  }

  return (
    <Card className="gap-2.5 px-4 py-4 ring-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="secondary" className="bg-tag text-tag-foreground border-tag-border">
          {REASON_LABELS[suggestion.reason]}
        </Badge>
        <span className="flex items-center gap-1.5 text-xs text-subtle-foreground first-letter:uppercase">
          <CalendarDays aria-hidden className="size-4 shrink-0" />
          {formatDayLong(suggestion.date)}
        </span>
      </div>
      <h3 className="text-lg leading-[1.1]">{suggestion.title}</h3>
      <p className="text-sm text-muted-foreground">{suggestion.why}</p>
      <span className="text-xs text-subtle-foreground">Ligne conseillée : {lineName}</span>
      <div className="mt-0.5 flex flex-wrap gap-2">
        <NewPostButton
          size="sm"
          prefill={{
            date: suggestion.date,
            subject: suggestion.subject,
            type: suggestion.type,
            lineCode: suggestion.lineCode,
            suggestionKey: suggestion.key,
          }}
        >
          <PencilLine aria-hidden />
          Rédiger ce post
        </NewPostButton>
        <Button variant="ghost" size="sm" onClick={dismiss} disabled={pending}>
          <X aria-hidden />
          Ignorer
        </Button>
      </div>
    </Card>
  )
}
