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

type ArchivePostDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

// Confirmation avant d'archiver un post (spec Création de post, P0 8).
export function ArchivePostDialog({ open, onOpenChange, onConfirm }: ArchivePostDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archiver ce post ?</AlertDialogTitle>
          <AlertDialogDescription>
            Il disparaît de la liste et du calendrier. Rien n&apos;est supprimé sur LinkedIn.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="secondary">Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Archiver</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
