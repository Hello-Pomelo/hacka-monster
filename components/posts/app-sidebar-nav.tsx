"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  CalendarDays,
  ChartColumn,
  Files,
  Lightbulb,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react"
import type { MouseEvent } from "react"

import { HOME_PANEL_ID, revealHomePanel } from "@/components/posts/home-scroll-target"
import { cn } from "@/lib/utils"

type NavKey = "calendar" | "ideas" | "posts" | "stats" | "settings"

type NavItem = {
  key: NavKey
  label: string
  icon: LucideIcon
  href: string
}

// Posts à valider (P1) et Mes préférences (P2) sont masqués en v1.
const NAV_ITEMS: NavItem[] = [
  { key: "calendar", label: "Mon calendrier", icon: CalendarDays, href: "/" },
  { key: "ideas", label: "Boîte à idées", icon: Lightbulb, href: "/?onglet=idees" },
  { key: "posts", label: "Tous les posts", icon: Files, href: "/posts" },
  { key: "stats", label: "Statistiques", icon: ChartColumn, href: "/stats" },
  { key: "settings", label: "Paramétrage rédaction", icon: SlidersHorizontal, href: "/parametrage" },
]

function activeKey(pathname: string, tab: string | null): NavKey | null {
  if (pathname === "/") return tab === "idees" ? "ideas" : "calendar"
  if (pathname.startsWith("/posts")) return "posts"
  if (pathname.startsWith("/stats")) return "stats"
  if (pathname.startsWith("/parametrage")) return "settings"
  return null
}

// « Boîte à idées » depuis l'accueil : l'URL peut rester la même, le clic fait donc défiler lui-même
// jusqu'à l'onglet Idées, et le lien ne ramène pas la page en haut (`scroll={false}`). Depuis un autre
// écran, le bloc sous le calendrier défile à son arrivée (HomeScrollTarget).
function revealIdeas(event: MouseEvent<HTMLAnchorElement>) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  revealHomePanel(document.getElementById(HOME_PANEL_ID))
}

const countClass =
  "ml-auto inline-grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums"

type AppSidebarNavProps = {
  ideaCount: number
  failedCount: number
}

export function AppSidebarNav({ ideaCount, failedCount }: AppSidebarNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = activeKey(pathname, searchParams.get("onglet"))

  return (
    <nav className="grid gap-1">
      {NAV_ITEMS.map(({ key, label, icon: Icon, href }) => (
        <Link
          key={key}
          href={href}
          scroll={key === "ideas" ? false : undefined}
          onClick={key === "ideas" && pathname === "/" ? revealIdeas : undefined}
          aria-current={current === key ? "page" : undefined}
          className={cn(
            "group flex h-10 items-center gap-3 rounded-lg px-3 font-medium whitespace-nowrap text-sidebar-muted transition-colors",
            "hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
            "aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-sidebar-foreground"
          )}
        >
          <Icon
            aria-hidden="true"
            className="size-[18px] shrink-0 group-aria-[current=page]:text-sidebar-link"
          />
          <span>{label}</span>
          {key === "ideas" && (
            <span className={cn(countClass, "bg-sidebar-accent text-sidebar-foreground")}>{ideaCount}</span>
          )}
          {key === "posts" && failedCount > 0 && (
            <span
              aria-label={`${failedCount} en échec`}
              className={cn(countClass, "bg-primary text-primary-foreground")}
            >
              {failedCount}
            </span>
          )}
        </Link>
      ))}
    </nav>
  )
}
