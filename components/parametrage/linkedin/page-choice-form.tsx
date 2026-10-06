"use client"

import { useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Link2 } from "lucide-react"
import { toast } from "sonner"

import {
  cancelLinkedInChoice,
  connectLinkedInPage,
} from "@/app/(app)/parametrage/linkedin-actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { LINKEDIN_ERROR_MESSAGES, type LinkedInPage } from "@/lib/linkedin/types"
import { formatImportCount } from "@/lib/parametrage/format"

import { ImportProgress } from "./reimport-button"

// Initiales d'une page : première lettre ou chiffre des deux premiers mots (« Hello Pomelo » → « HP »).
function pageInitials(name: string): string {
  const letters = name
    .split(/\s+/)
    .map((word) => word.match(/[\p{L}\p{N}]/u)?.[0] ?? "")
    .filter(Boolean)
  return letters.slice(0, 2).join("").toUpperCase() || "?"
}

type PageAvatarProps = {
  page: Pick<LinkedInPage, "name" | "logoUrl">
  size?: "default" | "sm" | "lg"
}

export function PageAvatar({ page, size = "default" }: PageAvatarProps) {
  return (
    <Avatar size={size}>
      {page.logoUrl && <AvatarImage src={page.logoUrl} alt="" />}
      <AvatarFallback className="bg-chip text-xs font-medium text-chip-foreground">
        {pageInitials(page.name)}
      </AvatarFallback>
    </Avatar>
  )
}

type PageChoiceFormProps = {
  pages: LinkedInPage[]
  returnTo: string
  demo: boolean
}

// Choix de la page après l'OAuth, puis import immédiat des posts (spec Paramétrage E0, spec Création de post E7).
export function PageChoiceForm({ pages, returnTo, demo }: PageChoiceFormProps) {
  const router = useRouter()
  const [selected, setSelected] = useState(pages[0]?.urn ?? "")
  const [connecting, startConnect] = useTransition()
  const [cancelling, startCancel] = useTransition()
  const busy = connecting || cancelling

  function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    startConnect(async () => {
      try {
        const result = await connectLinkedInPage(selected)
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        const { pageName, imported, importError } = result.data
        toast.success(`${pageName} connectée`)
        if (importError) toast.warning(importError)
        else if (imported) toast(formatImportCount(imported.imported))
        router.replace(returnTo)
        router.refresh()
      } catch {
        toast.error(LINKEDIN_ERROR_MESSAGES.error)
      }
    })
  }

  // Le résultat de l'OAuth expire seul après 10 minutes : on revient même si l'oubli a échoué.
  function cancel() {
    startCancel(async () => {
      try {
        const result = await cancelLinkedInChoice()
        if (!result.ok) toast.error(result.error)
      } catch {
        toast.error(LINKEDIN_ERROR_MESSAGES.error)
      }
      router.replace(returnTo)
    })
  }

  return (
    <Card className="ring-0">
      <CardHeader>
        <CardTitle role="heading" aria-level={2} className="text-lg">
          Choisissez la page à connecter
        </CardTitle>
        <CardDescription>Seules les pages que vous administrez sont proposées.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={connect} aria-busy={connecting} className="grid gap-4">
          <RadioGroup
            aria-label="Page LinkedIn à connecter"
            value={selected}
            onValueChange={(value) => setSelected(String(value))}
            disabled={busy}
            className="grid-cols-1 gap-2 md:grid-cols-2"
          >
            {pages.map((page) => (
              <label
                key={page.urn}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-input p-3 transition-colors not-has-data-checked:hover:bg-accent has-data-checked:border-primary has-data-checked:bg-tag has-data-disabled:cursor-not-allowed has-data-disabled:opacity-60"
              >
                <RadioGroupItem value={page.urn} />
                <PageAvatar page={page} />
                <span className="min-w-0 truncate font-medium">{page.name}</span>
              </label>
            ))}
          </RadioGroup>

          {demo && (
            <p className="text-xs text-subtle-foreground">
              Mode démo : la connexion est simulée, les posts importés sont fictifs.
            </p>
          )}

          {connecting && <ImportProgress label="Import des posts de la page…" />}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="h-10 px-4" disabled={busy || !selected}>
              {connecting ? <Spinner aria-hidden="true" /> : <Link2 aria-hidden="true" />}
              Connecter cette page
            </Button>
            <Button type="button" variant="ghost" className="h-10 px-4" disabled={busy} onClick={cancel}>
              {cancelling && <Spinner aria-hidden="true" />}
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
