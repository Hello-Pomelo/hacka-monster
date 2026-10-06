"use client"

import {
  History,
  LayoutTemplate,
  Megaphone,
  PlugZap,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useOptimistic, useTransition } from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  PARAMETRAGE_TAB_LABELS,
  PARAMETRAGE_TABS,
  parametrageHref,
  parseParametrageTab,
  type ParametrageTab,
} from "@/lib/parametrage/types"

const TAB_ICONS: Record<ParametrageTab, LucideIcon> = {
  connexion: PlugZap,
  charte: ShieldCheck,
  lignes: Megaphone,
  gabarits: LayoutTemplate,
  admins: Users,
  versions: History,
}

const TRIGGER_CLASS =
  "h-full flex-none px-1 text-muted-foreground after:bg-primary group-data-horizontal/tabs:after:bottom-[-1px]"

type ParametrageTabsProps = {
  current: ParametrageTab
}

// Onglets de /parametrage : l'URL (`?onglet=`) porte l'onglet, le serveur rend son contenu.
// L'onglet choisi s'affiche actif pendant le chargement de la page.
export function ParametrageTabs({ current }: ParametrageTabsProps) {
  const router = useRouter()
  const [selected, setSelected] = useOptimistic(current)
  const [isPending, startTransition] = useTransition()

  function select(value: unknown) {
    const tab = parseParametrageTab(value)
    if (tab === selected) return
    startTransition(() => {
      setSelected(tab)
      router.push(parametrageHref(tab), { scroll: false })
    })
  }

  return (
    <Tabs value={selected} onValueChange={select} aria-busy={isPending}>
      <TabsList
        variant="line"
        aria-label="Rubriques du paramétrage"
        className="w-full justify-start gap-5 rounded-none border-b p-0 group-data-horizontal/tabs:h-10"
      >
        {PARAMETRAGE_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab]
          return (
            <TabsTrigger key={tab} value={tab} className={TRIGGER_CLASS}>
              <Icon aria-hidden className="size-4" />
              {PARAMETRAGE_TAB_LABELS[tab]}
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
