import { CircleAlert, Sparkles } from "lucide-react"
import type { Metadata } from "next"

import { LineNotConfiguredBanner, LinkedInMissingBanner } from "@/components/posts/creation-banners"
import { NewPostForm } from "@/components/posts/new-post-form"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { isLineConfigured, newPostSearchSchema, resolveDefaultLine, type NewPostSearch } from "@/lib/creation"
import { getNewPostContext } from "@/lib/creation-data"

export const metadata: Metadata = { title: "Nouveau post" }

type NewPostPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function NewPostHeader() {
  return (
    <header className="grid max-w-[760px] min-w-0 gap-3">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-tag-border bg-tag px-2.5 py-1 text-xs font-medium tracking-[0.06em] text-tag-foreground uppercase">
        <Sparkles aria-hidden className="size-4" />
        Nouveau post
      </span>
      <h1 className="font-heading text-[32px]">Paramétrer votre post</h1>
      <p className="text-muted-foreground">
        L&apos;assistant rédige ensuite un premier jet dans le ton de votre ligne éditoriale. Vous le
        relisez avant toute publication.
      </p>
    </header>
  )
}

// E1 « Nouveau post » (spec Création de post). Préremplissage par les clés de newPostHref ;
// une valeur invalide est ignorée, sans erreur (spec Mon calendrier, 3.7).
export default async function NewPostPage({ searchParams }: NewPostPageProps) {
  const parsed = newPostSearchSchema.safeParse(await searchParams)
  const search: NewPostSearch = parsed.success ? parsed.data : {}
  const context = await getNewPostContext()

  if (!context) {
    return (
      <>
        <NewPostHeader />
        <Empty className="max-w-[760px] rounded-xl bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CircleAlert className="text-destructive" />
            </EmptyMedia>
            <EmptyTitle>Impossible de préparer le nouveau post</EmptyTitle>
            <EmptyDescription>Rechargez la page dans quelques instants.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </>
    )
  }

  const defaultLine = resolveDefaultLine(context.lines, {
    lineCode: search.lineCode,
    profileLineId: context.profileLineId,
  })
  const showLinkedInBanner = context.connection === null
  const showLineBanner = !isLineConfigured(defaultLine)

  return (
    <>
      <NewPostHeader />
      {(showLinkedInBanner || showLineBanner) && (
        <div className="grid max-w-[760px] gap-3">
          {showLinkedInBanner && <LinkedInMissingBanner />}
          {showLineBanner && <LineNotConfiguredBanner />}
        </div>
      )}
      <NewPostForm prefill={search} defaultLineId={defaultLine?.id ?? null} />
    </>
  )
}
