"use client"

import { useState, type KeyboardEvent } from "react"
import { X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type StringListInputProps = {
  id: string
  value: string[]
  onChange: (next: string[]) => void
  placeholder: string
  max?: number
  maxLength?: number
  disabled?: boolean
  addLabel?: string
  "aria-describedby"?: string
}

// Liste de courts textes (valeurs, expressions interdites, alias…) : saisie, Entrée ou « Ajouter »,
// puis pastilles retirables. Les doublons, sans tenir compte de la casse, sont ignorés.
export function StringListInput({
  id,
  value,
  onChange,
  placeholder,
  max,
  maxLength = 120,
  disabled = false,
  addLabel = "Ajouter",
  "aria-describedby": describedBy,
}: StringListInputProps) {
  const [draft, setDraft] = useState("")
  const full = max !== undefined && value.length >= max
  const candidate = draft.trim()

  function add() {
    if (!candidate || full || disabled) return
    const key = candidate.toLocaleLowerCase("fr")
    if (!value.some((item) => item.toLocaleLowerCase("fr") === key)) {
      onChange([...value, candidate])
    }
    setDraft("")
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return
    event.preventDefault()
    add()
  }

  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled || full}
          aria-describedby={describedBy}
          className="h-10 px-3"
        />
        <Button
          type="button"
          variant="secondary"
          className="h-10 px-4"
          onClick={add}
          disabled={disabled || full || !candidate}
        >
          {addLabel}
        </Button>
      </div>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((item, index) => (
            <li key={`${index}-${item}`}>
              <Badge
                variant="secondary"
                className="h-auto min-h-6 max-w-full gap-1 bg-chip py-0.5 pr-0.5 text-left whitespace-normal text-chip-foreground"
              >
                <span className="break-words">{item}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="size-5 shrink-0 hover:bg-accent"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                  disabled={disabled}
                  aria-label={`Retirer ${item}`}
                >
                  <X aria-hidden="true" />
                </Button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
