"use client"

import { useTransition } from "react"
import Link from "next/link"
import { unstable_rethrow } from "next/navigation"
import { LogOut, Settings, SlidersHorizontal, UserRound } from "lucide-react"
import { toast } from "sonner"

import { signOut } from "@/app/(app)/account-actions"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ACCOUNT_HREF } from "@/lib/calendar"

// Le nom peut être un e-mail : les initiales viennent alors de la partie locale.
function getInitials(name: string): string {
  const base = name.split("@")[0] ?? ""
  const parts = base.split(/[\s._-]+/).filter(Boolean)
  const letters = parts.length > 1 ? parts[0].charAt(0) + parts[1].charAt(0) : base.slice(0, 2)
  return letters.toUpperCase() || "?"
}

export function AccountMenu({ name }: { name: string }) {
  const [isPending, startTransition] = useTransition()
  const displayName = name.trim() || "Mon compte"

  function handleSignOut() {
    startTransition(async () => {
      try {
        await signOut()
      } catch (error) {
        // La redirection vers /login rejette la promesse de l'action : ce n'est pas un échec.
        unstable_rethrow(error)
        toast.error("La déconnexion a échoué. Réessayez dans un instant.")
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Menu du compte, ${displayName}`}
        className="group flex w-full items-center gap-2.5 rounded-lg p-2 text-left text-sidebar-foreground transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none data-popup-open:bg-sidebar-accent"
      >
        <Avatar className="after:border-transparent">
          <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <span className="grid min-w-0 flex-1 gap-0.5 text-[13px] leading-tight">
          <span className="truncate">{displayName}</span>
          <span className="text-xs text-sidebar-muted">Paramètres du compte</span>
        </span>
        <Settings
          aria-hidden="true"
          className="size-[18px] shrink-0 text-sidebar-muted group-hover:text-sidebar-link"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="min-w-56 shadow-float">
        <DropdownMenuItem render={<Link href={ACCOUNT_HREF} />}>
          <UserRound aria-hidden="true" />
          Paramètres du compte
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/parametrage" />}>
          <SlidersHorizontal aria-hidden="true" />
          Paramétrage rédaction
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isPending} onClick={handleSignOut}>
          <LogOut aria-hidden="true" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
