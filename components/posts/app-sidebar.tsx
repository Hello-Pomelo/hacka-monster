import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"

import { AccountMenu } from "@/components/posts/account-menu"
import { AppSidebarNav } from "@/components/posts/app-sidebar-nav"
import { ConnectionStatus } from "@/components/posts/connection-status"
import type { Profile } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

// Compteurs de la navigation : idées de la boîte à idées, posts en échec.
async function getNavCounts(): Promise<{ ideas: number; failed: number }> {
  const supabase = await createClient()
  const [ideas, failed] = await Promise.all([
    supabase.from("ideas").select("id", { count: "exact", head: true }),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "failed"),
  ])
  return { ideas: ideas.count ?? 0, failed: failed.count ?? 0 }
}

export async function AppSidebar({ profile }: { profile: Profile }) {
  const counts = await getNavCounts()

  return (
    <aside
      aria-label="Navigation principale"
      className="sticky top-0 flex h-screen flex-col gap-8 border-r bg-sidebar px-4 py-6 text-sidebar-foreground"
    >
      <Link href="/" aria-label="Community Monster, accueil" className="block px-1">
        <Image
          src="/logo-community-monster.png"
          alt="Community Monster"
          width={440}
          height={147}
          priority
          className="h-auto w-full max-w-[200px]"
        />
      </Link>

      {/* useSearchParams exige une frontière Suspense au build. */}
      <Suspense>
        <AppSidebarNav ideaCount={counts.ideas} failedCount={counts.failed} />
      </Suspense>

      <div className="mt-auto grid gap-3">
        <ConnectionStatus />
        <AccountMenu name={profile.nom} />
      </div>
    </aside>
  )
}
