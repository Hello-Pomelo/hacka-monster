import Link from "next/link"
import { ArrowLeft, Files, Import, PencilLine } from "lucide-react"

import { seriesLabel, type EditorPost, type LineOption, type SeriesSummary } from "@/lib/creation"
import { POST_TYPES, isPostTypeId } from "@/lib/post-types"
import { postTitle } from "@/lib/posts"

const TAG_CLASS =
  "inline-flex w-fit items-center gap-1.5 rounded-full border border-tag-border bg-tag px-2.5 py-1 text-xs font-medium tracking-[0.06em] text-tag-foreground uppercase"

type PostWorkspaceHeaderProps = {
  post: EditorPost
  series: SeriesSummary | null
  line: LineOption | null
  postCount: number
}

// En-tête de E3 : retour à la liste, série ou origine du post, sujet, ligne et type.
export function PostWorkspaceHeader({ post, series, line, postCount }: PostWorkspaceHeaderProps) {
  const TagIcon = post.origin === "linkedin_import" ? Import : post.series_id ? Files : PencilLine
  const tagLabel =
    series && post.series_id
      ? `Série · ${postCount} ${postCount > 1 ? "posts" : "post"}`
      : seriesLabel(post, series?.subject ?? null)
  const typeLabel = isPostTypeId(post.type) ? POST_TYPES[post.type].label : null
  const meta = [line?.name, typeLabel].filter(Boolean).join(" · ")

  return (
    <header className="grid gap-3">
      <Link
        href="/posts"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-link underline-offset-3 hover:underline"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Tous les posts
      </Link>
      <span className={TAG_CLASS}>
        <TagIcon aria-hidden className="size-4" />
        {tagLabel}
      </span>
      <h1 className="font-heading text-[32px]">{series?.subject || postTitle(post, 120)}</h1>
      {meta && <p className="text-sm text-muted-foreground">{meta}</p>}
    </header>
  )
}
