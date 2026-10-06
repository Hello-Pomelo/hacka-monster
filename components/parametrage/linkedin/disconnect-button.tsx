"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Unplug } from "lucide-react"
import { toast } from "sonner"

import { disconnectLinkedIn } from "@/app/(app)/parametrage/linkedin-actions"
import {
  AlertDialog,
  AlertDialogAction,
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

// Conséquence de la déconnexion sur les posts programmés (spec Création de post, E7).
function disconnectImpact(scheduledCount: number): string {
  if (scheduledCount === 0) return "Aucun post programmé n'est concerné."
  if (scheduledCount === 1) {
    return "1 post programmé ne pourra pas être publié tant qu'une page n'est pas reconnectée."
  }
  return `${scheduledCount} posts programmés ne pourront pas être publiés tant qu'une page n'est pas reconnectée.`
}

export function DisconnectButton({ scheduledCount }: { scheduledCount: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function disconnect() {
    startTransition(async () => {
      try {
        const result = await disconnectLinkedIn()
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        setOpen(false)
        toast.success("Page LinkedIn déconnectée")
        router.refresh()
      } catch {
        toast.error("La page LinkedIn n'a pas pu être déconnectée. Vérifiez votre connexion puis réessayez.")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <AlertDialogTrigger
        render={<Button variant="ghost" className="h-10 px-4 text-destructive hover:text-destructive" />}
      >
        <Unplug aria-hidden="true" />
        Déconnecter
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Déconnecter la page LinkedIn ?</AlertDialogTitle>
          <AlertDialogDescription>{disconnectImpact(scheduledCount)}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={disconnect} disabled={pending}>
            {pending && <Spinner aria-hidden="true" />}
            Déconnecter
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
