"use client"

import { useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { setMyLine } from "@/app/(app)/parametrage/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { isEditableLineCode, type EditableLineCode, type EditorialLine } from "@/lib/parametrage/types"

const LINE_DESCRIPTIONS: Record<EditableLineCode, string> = {
  marketing: "Notoriété, projets livrés, expertise.",
  rh: "Marque employeur, recrutement, vie des équipes.",
}

const CHOICE_CARD_CLASS =
  "rounded-xl border-input has-[>[data-slot=field]]:rounded-xl has-[>[data-slot=field]]:bg-card has-data-checked:border-primary has-data-checked:bg-tag *:data-[slot=field]:p-3"

type LineChoiceFormProps = {
  lines: EditorialLine[]
  currentCode: string | null
  // Fermeture du formulaire ouvert par « Changer » (étape Identité de l'onboarding).
  onDone?: () => void
  onCancel?: () => void
}

// Choix de la ligne de l'admin (E1, étape 1) : renseigne profiles.line_id (contrat 3).
export function LineChoiceForm({ lines, currentCode, onDone, onCancel }: LineChoiceFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [value, setValue] = useState<EditableLineCode>(
    isEditableLineCode(currentCode) ? currentCode : "marketing"
  )
  const choices = lines.filter((line) => isEditableLineCode(line.code))

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (value === currentCode) {
      onDone?.()
      return
    }
    startTransition(async () => {
      const result = await setMyLine(value)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      onDone?.()
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <RadioGroup
        value={value}
        onValueChange={(next) => {
          if (isEditableLineCode(next)) setValue(next)
        }}
        disabled={pending}
        aria-label="Ligne éditoriale"
        className="grid-cols-2 gap-3"
      >
        {choices.map((line) => (
          <FieldLabel key={line.id} htmlFor={`line-choice-${line.code}`} className={CHOICE_CARD_CLASS}>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle className="text-base">{line.name}</FieldTitle>
                <FieldDescription>
                  {isEditableLineCode(line.code) ? LINE_DESCRIPTIONS[line.code] : null}
                </FieldDescription>
                {line.configured && (
                  <span className="text-xs text-subtle-foreground">Déjà configurée par un admin</span>
                )}
              </FieldContent>
              <RadioGroupItem value={line.code} id={`line-choice-${line.code}`} />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
      <div className="flex gap-2">
        <Button type="submit" className="h-10 px-4" disabled={pending}>
          {pending && <Spinner aria-hidden="true" />}
          Choisir cette ligne
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" className="h-10 px-4" onClick={onCancel} disabled={pending}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  )
}

type CurrentLineSwitchProps = {
  lines: EditorialLine[]
  current: Pick<EditorialLine, "code" | "name">
}

// Rappel compact de la ligne choisie, avec « Changer » qui rouvre le choix sur place.
export function CurrentLineSwitch({ lines, current }: CurrentLineSwitchProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="grid gap-4">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        Ligne
        <Badge variant="secondary" className="bg-chip text-chip-foreground">
          {current.name}
        </Badge>
        <span aria-hidden="true">·</span>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-link"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          Changer
        </Button>
      </p>
      {open && (
        <LineChoiceForm
          lines={lines}
          currentCode={current.code}
          onDone={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  )
}
