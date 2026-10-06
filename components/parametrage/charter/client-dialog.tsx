"use client"

import { useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Plus } from "lucide-react"
import { toast } from "sonner"

import { addClient, updateClient } from "@/app/(app)/parametrage/actions"
import { StringListInput } from "@/components/parametrage/string-list-input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { clientInputSchema, type CharterClient, type ClientInput } from "@/lib/parametrage/types"

import { ClientStatusField } from "./client-status-field"

type ClientDialogProps = { mode: "create" } | { mode: "edit"; client: CharterClient }

type FieldErrors = { name?: string; aliases?: string }

// Limites de `clientInputSchema`, reprises dans la saisie des alias.
const MAX_ALIASES = 20
const MAX_NAME_LENGTH = 120

function initialValues(props: ClientDialogProps): ClientInput {
  if (props.mode === "create") return { name: "", aliases: [], status: "citable" }
  const { name, aliases, status } = props.client
  return { name, aliases, status }
}

function validate(values: ClientInput): { ok: true; data: ClientInput } | { ok: false; errors: FieldErrors } {
  const parsed = clientInputSchema.safeParse(values)
  if (parsed.success) return { ok: true, data: parsed.data }

  // Le statut vient toujours du RadioGroup : seuls le nom et les alias peuvent être refusés.
  const nameIssue = parsed.error.issues.find((issue) => issue.path[0] === "name")
  const aliasIssue = parsed.error.issues.some((issue) => issue.path[0] === "aliases")
  return {
    ok: false,
    errors: {
      name: nameIssue?.message,
      aliases: aliasIssue ? `${MAX_ALIASES} alias au plus, de ${MAX_NAME_LENGTH} caractères chacun.` : undefined,
    },
  }
}

// Ajout ou modification d'un client de la charte (spec Paramétrage, US4 et D7), avec son déclencheur.
export function ClientDialog(props: ClientDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<ClientInput>(() => initialValues(props))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [pending, startTransition] = useTransition()
  const editing = props.mode === "edit"
  const idPrefix = props.mode === "edit" ? `client-${props.client.id}` : "client-new"

  function handleOpenChange(next: boolean) {
    if (pending) return
    // Chaque ouverture repart des valeurs enregistrées, même après une saisie abandonnée.
    if (next) {
      setValues(initialValues(props))
      setErrors({})
    }
    setOpen(next)
  }

  // Une erreur affichée disparaît dès que la saisie reprend ; la validation repart à l'envoi.
  function update(patch: Partial<ClientInput>) {
    setValues((current) => ({ ...current, ...patch }))
    setErrors({})
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const checked = validate(values)
    if (!checked.ok) {
      setErrors(checked.errors)
      return
    }

    startTransition(async () => {
      try {
        const result =
          props.mode === "edit"
            ? await updateClient(props.client.id, checked.data)
            : await addClient(checked.data)
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        setOpen(false)
        toast.success(editing ? "Client modifié" : "Client ajouté")
        router.refresh()
      } catch {
        toast.error("Le client n'a pas pu être enregistré. Vérifiez votre connexion puis réessayez.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {props.mode === "edit" ? (
        <DialogTrigger
          render={<Button variant="ghost" size="sm" aria-label={`Modifier ${props.client.name}`} />}
        >
          <Pencil aria-hidden />
          Modifier
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button size="sm" />}>
          <Plus aria-hidden />
          Ajouter un client
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[560px]" showCloseButton={false}>
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le client" : "Ajouter un client"}</DialogTitle>
            <DialogDescription>
              Un client non citable bloque la programmation d&apos;un post qui le cite.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field data-invalid={errors.name ? true : undefined}>
              <FieldLabel htmlFor={`${idPrefix}-name`}>Nom</FieldLabel>
              <Input
                id={`${idPrefix}-name`}
                value={values.name}
                onChange={(event) => update({ name: event.target.value })}
                maxLength={MAX_NAME_LENGTH}
                required
                autoComplete="off"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? `${idPrefix}-name-error` : undefined}
                disabled={pending}
                className="h-10 px-4"
              />
              <FieldError id={`${idPrefix}-name-error`}>{errors.name}</FieldError>
            </Field>

            <Field data-invalid={errors.aliases ? true : undefined}>
              <FieldLabel htmlFor={`${idPrefix}-aliases`}>Alias</FieldLabel>
              <FieldDescription id={`${idPrefix}-aliases-description`}>
                Autres noms qui désignent ce client : sigle, marque, ancien nom.
              </FieldDescription>
              <StringListInput
                id={`${idPrefix}-aliases`}
                value={values.aliases}
                onChange={(aliases) => update({ aliases })}
                placeholder="Ajouter un alias"
                max={MAX_ALIASES}
                maxLength={MAX_NAME_LENGTH}
                disabled={pending}
                aria-describedby={`${idPrefix}-aliases-description`}
              />
              <FieldError>{errors.aliases}</FieldError>
            </Field>

            <ClientStatusField
              idPrefix={idPrefix}
              value={values.status}
              onChange={(status) => update({ status })}
              disabled={pending}
            />
          </FieldGroup>

          <DialogFooter>
            <DialogClose
              render={<Button type="button" variant="outline" className="h-10 px-4" />}
              disabled={pending}
            >
              Annuler
            </DialogClose>
            <Button type="submit" className="h-10 px-4" disabled={pending}>
              {pending && <Spinner aria-hidden="true" />}
              {editing ? "Enregistrer" : "Ajouter le client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
