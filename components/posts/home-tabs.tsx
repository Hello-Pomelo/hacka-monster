"use client"

import { Sparkles } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, type ReactNode } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HOME_TABS, type HomeTab } from "@/lib/calendar"

const TRIGGER_CLASS =
  "group/tab h-full flex-none px-1 text-muted-foreground after:bg-primary group-data-horizontal/tabs:after:bottom-[-1px]"

const DEFAULT_TAB: HomeTab = "suggestions"

function isHomeTab(value: unknown): value is HomeTab {
  return (HOME_TABS as readonly unknown[]).includes(value)
}

function Count({ value }: { value: number }) {
  return (
    <span className="inline-grid h-5 min-w-5 place-items-center rounded-full bg-chip px-1.5 text-xs text-chip-foreground tabular-nums group-data-active/tab:bg-primary group-data-active/tab:text-primary-foreground">
      {value}
    </span>
  )
}

type HomeTabsProps = {
  counts: Record<HomeTab, number>
  suggestions: ReactNode
  upcoming: ReactNode
  ideas: ReactNode
}

// Onglets sous le calendrier (spec Mon calendrier 3.5). L'onglet actif suit le paramètre `onglet` :
// le lien « Boîte à idées » de la navigation (`/?onglet=idees`) bascule l'onglet même depuis l'accueil.
// Un changement d'onglet remplace l'URL et fait recalculer la page par le serveur : les liens construits
// côté serveur (mois, filtre, jours, fermeture de la vue jour) gardent ainsi l'onglet actif.
// L'onglet choisi s'affiche sans attendre la réponse, jusqu'au changement d'URL suivant.
export function HomeTabs({ counts, suggestions, upcoming, ideas }: HomeTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const query = searchParams.toString()
  const requested = searchParams.get("onglet")
  const tab = isHomeTab(requested) ? requested : DEFAULT_TAB

  const [pick, setPick] = useState<{ tab: HomeTab; query: string } | null>(null)
  if (pick && pick.query !== query) setPick(null)
  const active = pick && pick.query === query ? pick.tab : tab

  function selectTab(next: unknown) {
    if (!isHomeTab(next) || next === active) return
    const params = new URLSearchParams(query)
    if (next === DEFAULT_TAB) params.delete("onglet")
    else params.set("onglet", next)
    const nextQuery = params.toString()
    setPick({ tab: next, query })
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }

  return (
    <section aria-label="Suggestions, posts à venir et idées" className="min-w-0">
      <Tabs value={active} onValueChange={selectTab} className="gap-4">
        <TabsList
          variant="line"
          className="w-full justify-start gap-3 rounded-none border-b p-0 group-data-horizontal/tabs:h-10"
        >
          <TabsTrigger value="suggestions" className={TRIGGER_CLASS}>
            <Sparkles aria-hidden />
            Suggestions
            <Count value={counts.suggestions} />
          </TabsTrigger>
          <TabsTrigger value="a-venir" className={TRIGGER_CLASS}>
            À venir
            <Count value={counts["a-venir"]} />
          </TabsTrigger>
          <TabsTrigger value="idees" className={TRIGGER_CLASS}>
            Idées
            <Count value={counts.idees} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions">{suggestions}</TabsContent>
        <TabsContent value="a-venir">{upcoming}</TabsContent>
        <TabsContent value="idees">{ideas}</TabsContent>
      </Tabs>
    </section>
  )
}
