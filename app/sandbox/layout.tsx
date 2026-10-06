import Link from "next/link"

import { Button } from "@/components/ui/button"
import { getCurrentProfile } from "@/lib/supabase/auth"

import { signOut } from "./actions"

// Front temporaire pour tester les fonctionnalités existantes, en attendant le design.
// Tout est dans app/sandbox/ : supprimer ce dossier suffit à le retirer.
export default async function SandboxLayout({ children }: LayoutProps<"/sandbox">) {
  const profile = await getCurrentProfile()

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/sandbox" className="font-semibold">
            Hacka Monster <span className="text-muted-foreground">· front temporaire</span>
          </Link>
          {profile && (
            <form action={signOut} className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">
                {profile.nom} ({profile.role})
              </span>
              <Button type="submit" variant="outline" size="sm">
                Déconnexion
              </Button>
            </form>
          )}
        </div>
      </header>
      {children}
    </div>
  )
}
