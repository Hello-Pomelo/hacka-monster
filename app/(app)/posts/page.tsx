import { Suspense } from "react"
import { Files, Plus } from "lucide-react"
import type { Metadata } from "next"

import { FailedPostsBanner } from "@/components/posts/failed-posts-banner"
import { NewPostButton } from "@/components/posts/new-post-button"
import { PageFallback } from "@/components/posts/page-fallback"
import { PostsFilters } from "@/components/posts/posts-filters"
import { PostsTable } from "@/components/posts/posts-table"
import { Skeleton } from "@/components/ui/skeleton"
import { listPosts } from "@/lib/creation-data"
import { hasListFilters, parsePostListSearch } from "@/lib/post-list"

export const metadata: Metadata = { title: "Tous les posts" }

type PostsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

// E6 « Tous les posts » : tous les posts de la page, quel que soit l'admin (D27).
export default async function PostsPage({ searchParams }: PostsPageProps) {
  const search = await searchParams
  const filters = parsePostListSearch({ statut: search.statut, ligne: search.ligne })
  const data = await listPosts(filters)

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid min-w-0 gap-3">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-tag-border bg-tag px-2.5 py-1 text-xs font-medium tracking-[0.06em] text-tag-foreground uppercase">
            <Files aria-hidden className="size-4" />
            Tous les posts
          </span>
          <h1 className="font-heading text-[32px]">Tous les posts</h1>
        </div>
        <NewPostButton className="h-10 gap-2 px-4">
          <Plus aria-hidden className="size-4" />
          Nouveau post
        </NewPostButton>
      </header>

      {data === null ? (
        <PageFallback
          title="Impossible de charger les posts"
          description="Rechargez la page dans quelques instants."
        />
      ) : (
        <>
          {data.failedCount > 0 && <FailedPostsBanner count={data.failedCount} filters={filters} />}
          {/* `data-pending` posé par les filtres pendant la relecture de la page : la liste s'estompe. */}
          <section aria-label="Liste des posts" className="group/list grid min-w-0 gap-4">
            <Suspense fallback={<Skeleton className="h-8 w-[480px] bg-chip" />}>
              <PostsFilters />
            </Suspense>
            <div className="min-w-0 transition-opacity group-has-[[data-pending]]/list:opacity-60">
              <PostsTable rows={data.rows} filtered={hasListFilters(filters)} />
            </div>
          </section>
        </>
      )}
    </>
  )
}
