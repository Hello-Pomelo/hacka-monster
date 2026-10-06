import { CircleAlert, UserRound } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { AccountSettingsForm } from "@/components/posts/account-settings-form"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { SETTINGS_CONNECTION_HREF } from "@/lib/calendar"
import { requireProfile } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Paramètres du compte" }

// Lignes de rattachement proposées : celles des équipes v1. Neutre n'est pas un choix.
const ACCOUNT_LINE_CODES = ["marketing", "rh"]

function AccountHeader() {
  return (
    <header className="grid max-w-[720px] min-w-0 gap-3">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-tag-border bg-tag px-2.5 py-1 text-xs font-medium tracking-[0.06em] text-tag-foreground uppercase">
        <UserRound aria-hidden className="size-4" />
        Compte
      </span>
      <h1 className="font-heading text-[32px]">Paramètres du compte</h1>
    </header>
  )
}

function LoadError() {
  return (
    <Empty className="rounded-xl bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlert className="text-destructive" />
        </EmptyMedia>
        <EmptyTitle>Impossible de charger vos paramètres</EmptyTitle>
        <EmptyDescription>Rechargez la page dans quelques instants.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

// Paramètres du compte : nom, ligne de rattachement, e-mail en lecture seule (profiles n'a pas d'e-mail).
export default async function AccountPage() {
  const profile = await requireProfile()
  const supabase = await createClient()
  const [claimsResult, linesResult] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.from("editorial_lines").select("id, code, name").in("code", ACCOUNT_LINE_CODES).order("code"),
  ])
  const email = claimsResult.data?.claims.email || null

  if (linesResult.error) {
    return (
      <>
        <AccountHeader />
        <LoadError />
      </>
    )
  }

  return (
    <>
      <AccountHeader />
      <div className="grid max-w-[560px] gap-6">
        <Card className="p-6 ring-0">
          <AccountSettingsForm
            name={profile.nom}
            email={email}
            lineId={profile.line_id}
            lines={linesResult.data}
          />
        </Card>
        <Card className="gap-3 p-6 ring-0">
          <h2 className="font-heading text-xl">Connexion LinkedIn</h2>
          <p className="text-muted-foreground">La connexion de la page LinkedIn se gère dans le paramétrage.</p>
          <Link
            href={SETTINGS_CONNECTION_HREF}
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "w-fit")}
          >
            Gérer la connexion
          </Link>
        </Card>
      </div>
    </>
  )
}
