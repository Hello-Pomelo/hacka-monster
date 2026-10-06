import type { Metadata } from "next"
import { Suspense } from "react"
import { z } from "zod"

import { AdminsTab } from "@/components/parametrage/admins/admins-tab"
import { CharterSection } from "@/components/parametrage/charter/charter-section"
import { LinesSection } from "@/components/parametrage/lines/lines-section"
import { LinkedInConnectionSection } from "@/components/parametrage/linkedin/linkedin-connection-section"
import { ParametrageHeader } from "@/components/parametrage/parametrage-header"
import { ParametrageTabs } from "@/components/parametrage/parametrage-tabs"
import { SectionErrorBoundary } from "@/components/parametrage/section-error-boundary"
import { TabSkeleton } from "@/components/parametrage/tab-skeleton"
import { TemplatesTab } from "@/components/parametrage/templates/templates-tab"
import { VersionsTab } from "@/components/parametrage/versions/versions-tab"
import { parametrageHref, parseParametrageTab, type ParametrageTab } from "@/lib/parametrage/types"

export const metadata: Metadata = { title: "Paramétrage rédaction" }

// Paramètre absent, répété ou invalide : valeur par défaut, sans erreur.
const searchSchema = z.object({
  onglet: z.string().optional().catch(undefined),
  ligne: z.string().optional().catch(undefined),
  linkedin: z.string().optional().catch(undefined),
})

type ParametragePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

type TabContentProps = {
  tab: ParametrageTab
  lineCode: string | undefined
  linkedinParam: string | undefined
}

function TabContent({ tab, lineCode, linkedinParam }: TabContentProps) {
  switch (tab) {
    case "connexion":
      return (
        <LinkedInConnectionSection
          variant="settings"
          returnTo={parametrageHref("connexion")}
          linkedinParam={linkedinParam}
          manualFallbackHref={parametrageHref("lignes")}
        />
      )
    case "charte":
      return <CharterSection variant="settings" />
    case "lignes":
      return <LinesSection lineCode={lineCode} />
    case "gabarits":
      return <TemplatesTab />
    case "admins":
      return <AdminsTab />
    case "versions":
      return <VersionsTab />
  }
}

// Espace Paramétrage permanent (spec Paramétrage, E2) : un onglet par `?onglet=`.
export default async function ParametragePage({ searchParams }: ParametragePageProps) {
  const search = searchSchema.parse(await searchParams)
  const tab = parseParametrageTab(search.onglet)

  return (
    <>
      <ParametrageHeader />
      <ParametrageTabs current={tab} />
      <SectionErrorBoundary key={tab} title="Impossible de charger cet onglet">
        <Suspense fallback={<TabSkeleton />}>
          <TabContent tab={tab} lineCode={search.ligne} linkedinParam={search.linkedin} />
        </Suspense>
      </SectionErrorBoundary>
    </>
  )
}
