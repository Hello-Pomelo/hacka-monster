import type { ReactNode } from "react"

import { AppSidebar } from "@/components/posts/app-sidebar"
import { NewPostFab } from "@/components/posts/new-post-button"
import { requireProfile } from "@/lib/supabase/auth"

export default async function AppLayout({ children }: { children: ReactNode }) {
  const profile = await requireProfile()

  return (
    <div className="grid min-h-screen flex-1 grid-cols-[248px_minmax(0,1fr)]">
      <AppSidebar profile={profile} />
      <main className="grid min-w-0 content-start gap-6 px-8 pt-8 pb-28">{children}</main>
      <NewPostFab />
    </div>
  )
}
