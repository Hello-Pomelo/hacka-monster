"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type PublishNowDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pageName: string
  onConfirm: () => void
}

// Confirmation avant une publication immédiate : le post part réellement sur la page LinkedIn.
export function PublishNowDialog({ open, onOpenChange, pageName, onConfirm }: PublishNowDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publier ce post maintenant ?</AlertDialogTitle>
          <AlertDialogDescription>
            Il sera publié tout de suite sur la page {pageName}. Un post publié ne se modifie plus
            depuis l&apos;outil.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="secondary">Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Publier</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
