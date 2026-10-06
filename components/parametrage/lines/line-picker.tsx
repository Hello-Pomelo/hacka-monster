"use client"

// Client : `Badge` (Base UI) appelle des hooks client, interdits dans un Server Component.

import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { parametrageHref, type EditableLineCode, type EditorialLine } from "@/lib/parametrage/types"
import { cn } from "@/lib/utils"

type LinePickerProps = {
  lines: (Pick<EditorialLine, "name" | "configured"> & { code: EditableLineCode })[]
  selectedCode: EditableLineCode
  myCode: EditableLineCode | null
}

// Choix de la ligne affichée dans l'onglet Lignes (Marketing ou RH), par le paramètre `ligne`.
export function LinePicker({ lines, selectedCode, myCode }: LinePickerProps) {
  return (
    <nav aria-label="Lignes éditoriales" className="inline-flex w-fit gap-1 rounded-xl bg-card p-1">
      {lines.map((line) => {
        const selected = line.code === selectedCode
        return (
          <Link
            key={line.code}
            href={parametrageHref("lignes", { ligne: line.code })}
            aria-current={selected ? "page" : undefined}
            scroll={false}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "h-10 gap-2 px-4 text-muted-foreground",
              selected && "bg-tag text-tag-foreground ring-1 ring-tag-border hover:bg-tag hover:text-tag-foreground"
            )}
          >
            {line.name}
            {line.configured ? (
              <Badge
                variant="secondary"
                className="h-[22px] bg-success-surface text-[11px] tracking-[0.05em] text-success uppercase"
              >
                Active
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="h-[22px] bg-warning-surface text-[11px] tracking-[0.05em] text-warning uppercase"
              >
                Non configurée
              </Badge>
            )}
            {line.code === myCode && (
              <span className="rounded-full bg-chip px-2 py-0.5 text-xs text-chip-foreground">
                Votre ligne
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
