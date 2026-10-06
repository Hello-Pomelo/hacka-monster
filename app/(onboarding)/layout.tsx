import type { ReactNode } from "react"

import { requireProfile } from "@/lib/supabase/auth"

// Onboarding de la première connexion : hors du groupe (app), donc sans barre latérale
// ni bouton flottant « Créer un nouveau post ».
export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  await requireProfile()

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-page">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-background px-8">
        <span className="font-heading text-[22px] leading-none font-medium tracking-[-0.04em]">
          hello pomelo
        </span>
        <span className="text-xs tracking-[0.06em] text-subtle-foreground uppercase">
          Posts LinkedIn
        </span>
      </header>
      <main className="mx-auto grid w-full max-w-[880px] min-w-0 content-start gap-6 px-8 pt-8 pb-28">
        {children}
      </main>
    </div>
  )
}
