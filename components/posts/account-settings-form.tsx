"use client"

import { useState, useTransition, type FormEvent } from "react"
import { toast } from "sonner"

import { updateAccount } from "@/app/(app)/account-actions"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type AccountLine = { id: string; code: string; name: string }

type AccountSettingsFormProps = {
  name: string
  email: string | null
  lineId: string | null
  lines: AccountLine[]
}

// Une ligne absente de la liste (Neutre, après un onboarding passé) s'affiche comme « aucune ligne ».
function knownLineId(lineId: string | null, lines: AccountLine[]): string | null {
  return lines.some((line) => line.id === lineId) ? lineId : null
}

export function AccountSettingsForm({ name: initialName, email, lineId: initialLineId, lines }: AccountSettingsFormProps) {
  const initialLine = knownLineId(initialLineId, lines)
  const [saved, setSaved] = useState({ name: initialName.trim(), lineId: initialLine })
  const [name, setName] = useState(initialName)
  const [lineId, setLineId] = useState<string | null>(initialLine)
  const [isPending, startTransition] = useTransition()

  const lineItems = Object.fromEntries(lines.map((line) => [line.id, line.name]))
  const trimmedName = name.trim()
  const changed = trimmedName !== saved.name || lineId !== saved.lineId
  const canSubmit = !isPending && changed && trimmedName.length > 0

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    const next = { name: trimmedName, lineId }
    // Ligne non modifiée : elle n'est pas envoyée, pour ne pas remplacer une ligne Neutre par « aucune ».
    const lineChanged = lineId !== saved.lineId
    startTransition(async () => {
      try {
        const result = await updateAccount(lineChanged ? next : { name: next.name })
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        setSaved(next)
        setName(next.name)
        toast.success("Paramètres enregistrés.")
      } catch {
        toast.error("Vos paramètres n'ont pas pu être enregistrés. Réessayez dans un instant.")
      }
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="account-name">Nom</FieldLabel>
          <Input
            id="account-name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            required
            disabled={isPending}
            className="h-10"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="account-email">Adresse e-mail</FieldLabel>
          <Input id="account-email" value={email ?? "Non renseignée"} readOnly disabled className="h-10" />
          <FieldDescription>Adresse de votre compte Google.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="account-line">Ligne éditoriale</FieldLabel>
          <Select items={lineItems} value={lineId} onValueChange={setLineId} disabled={isPending}>
            <SelectTrigger id="account-line" className="w-full data-[size=default]:h-10">
              <SelectValue placeholder="Choisir une ligne" />
            </SelectTrigger>
            <SelectContent>
              {lines.map((line) => (
                <SelectItem key={line.id} value={line.id}>
                  {line.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>Ligne proposée par défaut à la création de vos posts.</FieldDescription>
        </Field>
      </FieldGroup>

      <div className="flex justify-end">
        <Button type="submit" disabled={!canSubmit} className="h-10 px-4">
          Enregistrer
        </Button>
      </div>
    </form>
  )
}
