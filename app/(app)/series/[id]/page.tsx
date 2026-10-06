import { Sparkles } from "lucide-react"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { SeriesForm } from "@/components/posts/series-form"
import { getSeriesFormData } from "@/lib/creation-data"
import { todayInParis } from "@/lib/series"

export const metadata: Metadata = { title: "Paramètres de la série" }

type SeriesPageProps = {
  params: Promise<{ id: string }>
}

// E2 « Paramètres de la série » (spec Création de post). Une série déjà générée ouvre son premier post.
export default async function SeriesPage({ params }: SeriesPageProps) {
  const { id } = await params
  const data = await getSeriesFormData(id)
  if (!data) notFound()
  if (data.firstPostId) redirect(`/posts/${data.firstPostId}`)

  return (
    <div className="grid min-w-0 gap-6">
      <header className="grid gap-3">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-tag-border bg-tag px-2.5 py-1 text-xs font-medium tracking-[0.06em] text-tag-foreground uppercase">
          <Sparkles aria-hidden className="size-4" />
          Nouvelle série
        </span>
        <h1 className="font-heading text-[32px]">Paramètres de la série</h1>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-6">
        <SeriesForm
          series={data.series}
          settings={data.settings}
          lines={data.lines}
          profileLineId={data.profileLineId}
          charter={data.charter}
          today={todayInParis()}
        />
      </div>
    </div>
  )
}
