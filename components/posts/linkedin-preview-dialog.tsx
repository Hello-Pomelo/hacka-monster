"use client"

import { Globe, X } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CREATION_TEXTS } from "@/lib/creation"

// Coupure du texte au « voir plus » (spec Création de post, E4 : vers 210 caractères).
const PREVIEW_CUT = 210

// Texte coupé au dernier blanc avant la limite, ou null s'il tient en entier.
function cutForPreview(text: string): string | null {
  if (text.length <= PREVIEW_CUT) return null
  const cut = text.slice(0, PREVIEW_CUT)
  const lastBreak = cut.search(/\s\S*$/)
  return `${(lastBreak > 0 ? cut.slice(0, lastBreak) : cut).trimEnd()}…`
}

function initials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
  return letters || "?"
}

type LinkedInPostCardProps = {
  text: string
  imageUrl: string | null
  imageAlt: string | null
  pageName: string
  pageLogoUrl: string | null
}

// Carte de post façon LinkedIn. Les couleurs et la police codées en dur imitent l'interface de
// LinkedIn : seule exception à la règle des classes sémantiques (docs/design.md).
// Montée avec la modale : « voir plus » repart replié à chaque ouverture.
function LinkedInPostCard({ text, imageUrl, imageAlt, pageName, pageLogoUrl }: LinkedInPostCardProps) {
  const [expanded, setExpanded] = useState(false)
  const body = text.trim()
  const cut = cutForPreview(body)

  return (
    <article
      aria-label={`Post de ${pageName}`}
      className="overflow-hidden rounded-lg border border-[#e0dfdc] bg-[#ffffff] font-[-apple-system,system-ui,'Segoe_UI',Roboto,'Helvetica_Neue',sans-serif] text-[rgba(0,0,0,0.9)]"
    >
      <header className="flex items-start gap-2 px-4 pt-3">
        <Avatar className="size-12 rounded-none after:rounded-none after:border-transparent">
          {pageLogoUrl && <AvatarImage src={pageLogoUrl} alt="" className="rounded-none" />}
          <AvatarFallback className="rounded-none bg-[#f4f2ee] font-semibold text-[rgba(0,0,0,0.6)]">
            {initials(pageName)}
          </AvatarFallback>
        </Avatar>
        <div className="grid min-w-0 leading-tight">
          <span className="truncate text-sm font-semibold">{pageName}</span>
          <span className="text-xs text-[rgba(0,0,0,0.6)]">Page entreprise</span>
          <span className="flex items-center gap-1 text-xs text-[rgba(0,0,0,0.6)]">
            Maintenant ·
            <Globe aria-hidden className="size-3" />
            <span className="sr-only">Visible par tous</span>
          </span>
        </div>
      </header>

      <div className="px-4 pt-2 pb-3 text-sm leading-5 break-words whitespace-pre-wrap">
        {!body ? (
          <span className="text-[rgba(0,0,0,0.6)]">Le post n&apos;a pas encore de texte.</span>
        ) : cut && !expanded ? (
          <>
            {cut}{" "}
            <Button
              variant="link"
              className="h-auto p-0 align-baseline text-sm font-normal text-[rgba(0,0,0,0.6)] hover:underline"
              onClick={() => setExpanded(true)}
            >
              voir plus
            </Button>
          </>
        ) : (
          body
        )}
      </div>

      {imageUrl && (
        <Image
          src={imageUrl}
          alt={imageAlt ?? ""}
          width={0}
          height={0}
          sizes="480px"
          unoptimized
          className="h-auto w-full"
        />
      )}
    </article>
  )
}

type LinkedInPreviewDialogProps = LinkedInPostCardProps & {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// E4 : rendu indicatif du post sur la page LinkedIn.
export function LinkedInPreviewDialog({
  open,
  onOpenChange,
  ...card
}: LinkedInPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100dvh-2rem)] flex-col gap-5 p-6 sm:max-w-[560px]"
      >
        <DialogHeader className="pr-10">
          <DialogTitle className="text-2xl leading-[1.05]">Aperçu du post</DialogTitle>
          <DialogDescription>{CREATION_TEXTS.previewNotice}</DialogDescription>
        </DialogHeader>
        <DialogClose
          aria-label="Fermer"
          render={<Button variant="ghost" size="icon" className="absolute top-5 right-5" />}
        >
          <X aria-hidden />
        </DialogClose>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-page p-4">
          <LinkedInPostCard {...card} />
        </div>

        <DialogFooter className="m-0 rounded-none border-0 bg-transparent p-0">
          <DialogClose render={<Button variant="secondary" className="h-10 px-4" />}>
            Fermer
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
