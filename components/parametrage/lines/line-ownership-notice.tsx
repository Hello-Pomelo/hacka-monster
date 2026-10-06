"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Lock } from "lucide-react"
import { toast } from "sonner"

import { setMyLine } from "@/app/(app)/parametrage/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { isEditableLineCode, type EditorialLine } from "@/lib/parametrage/types"

type LineOwnershipNoticeProps = {
  line: EditorialLine
  myLineName: string | null
  // Faux quand la ligne actuelle n'est modifiable par personne (aucune ligne, ou ligne Neutre).
  currentLineEditable?: boolean
}

// Ligne d'une autre équipe (D15) : lecture seule, avec la possibilité de s'y rattacher.
export function LineOwnershipNotice({
  line,
  myLineName,
  currentLineEditable = myLineName !== null,
}: LineOwnershipNoticeProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function attach() {
    const code = line.code
    if (!isEditableLineCode(code)) return
    startTransition(async () => {
      try {
        const result = await setMyLine(code)
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        setOpen(false)
        toast.success(`Vous êtes rattaché à la ligne ${line.name}`)
        router.refresh()
      } catch {
        toast.error("Votre ligne n'a pas pu être enregistrée. Vérifiez votre connexion puis réessayez.")
      }
    })
  }

  return (
    <Alert className="items-center rounded-xl border-0 px-4 py-3">
      <Lock aria-hidden="true" />
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3 text-foreground">
        <span>
          {myLineName === null
            ? "Vous n'êtes rattaché à aucune ligne."
            : `Vous êtes rattaché à la ligne ${myLineName}.`}{" "}
          Seuls les admins de la ligne {line.name} la modifient.
        </span>
        <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
          <AlertDialogTrigger render={<Button variant="secondary" className="h-10 px-4" />}>
            Me rattacher à la ligne {line.name}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Changer de ligne ?</AlertDialogTitle>
              <AlertDialogDescription>
                Vous pourrez modifier la ligne {line.name}.
                {currentLineEditable && " Votre ligne actuelle ne sera plus modifiable par vous."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
              <Button onClick={attach} disabled={pending}>
                {pending && <Spinner aria-hidden="true" />}
                Me rattacher
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AlertDescription>
    </Alert>
  )
}
