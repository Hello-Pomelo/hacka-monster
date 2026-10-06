"use client"

// Espace de relecture d'un post (E3). Toute la série vit dans l'état client : changer de post ne
// recharge pas la page, si bien que la génération au fil de l'eau continue pendant la relecture.
// Le post courant passe dans l'URL en paramètre `post`, jamais dans le chemin : une Server Action
// qui revalide rend l'URL courante, et un autre `[id]` remonterait l'écran et sa file de génération.

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Files, Import, PencilLine } from "lucide-react"

import { GuardrailChecklist } from "@/components/posts/guardrail-checklist"
import { PostActions } from "@/components/posts/post-actions"
import { PostEditorCard } from "@/components/posts/post-editor-card"
import { PostStatusPanel } from "@/components/posts/post-status-panel"
import { SeriesTimeline } from "@/components/posts/series-timeline"
import { useAutosave, type AutosavePatch } from "@/components/posts/use-autosave"
import { usePostGeneration } from "@/components/posts/use-post-generation"
import { useSeriesGeneration } from "@/components/posts/use-series-generation"
import {
  seriesLabel,
  type EditorPost,
  type LineOption,
  type LinkedInConnectionSummary,
  type SeriesSummary,
} from "@/lib/creation"
import { checkGuardrails, type CharterRules } from "@/lib/guardrails"
import { POST_TYPES, isPostTypeId } from "@/lib/post-types"
import { isReadOnly, parsePostParams, postTitle } from "@/lib/posts"

const POST_PARAM = "post"
const TAG_CLASS =
  "inline-flex w-fit items-center gap-1.5 rounded-full border border-tag-border bg-tag px-2.5 py-1 text-xs font-medium tracking-[0.06em] text-tag-foreground uppercase"

function postUrl(routePostId: string, postId: string): string {
  return postId === routePostId ? `/posts/${routePostId}` : `/posts/${routePostId}?${POST_PARAM}=${postId}`
}

const isNewer = (a: EditorPost, b: EditorPost) => Date.parse(a.updated_at) >= Date.parse(b.updated_at)

// Données serveur fraîches (après une revalidation) : chaque post garde sa version la plus récente.
function mergeServerPosts(local: EditorPost[], server: EditorPost[]): EditorPost[] {
  const localById = new Map(local.map((post) => [post.id, post]))
  return server.map((post) => {
    const current = localById.get(post.id)
    return current && isNewer(current, post) ? current : post
  })
}

type PostWorkspaceProps = {
  post: EditorPost
  seriesPosts: EditorPost[]
  series: SeriesSummary | null
  line: LineOption | null
  charter: CharterRules
  connection: LinkedInConnectionSummary | null
  initialPostId: string
  // Identifiant du chemin `/posts/[id]`, fixe pendant toute la vie de l'écran.
  routePostId: string
  autoStart: boolean
}

export function PostWorkspace({
  post,
  seriesPosts,
  series,
  line,
  charter,
  connection,
  initialPostId,
  routePostId,
  autoStart,
}: PostWorkspaceProps) {
  const [posts, setPosts] = useState(() => (seriesPosts.some((item) => item.id === post.id) ? seriesPosts : [post]))
  const [serverPosts, setServerPosts] = useState(seriesPosts)
  if (serverPosts !== seriesPosts) {
    setServerPosts(seriesPosts)
    setPosts((local) => (seriesPosts.length > 0 ? mergeServerPosts(local, seriesPosts) : local))
  }
  const [currentId, setCurrentId] = useState(initialPostId)
  // Saisie en cours par post : elle prime sur le texte enregistré jusqu'à la prochaine génération.
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [scheduleRevision, setScheduleRevision] = useState(0)
  const [initialAutoStart] = useState(autoStart)

  const postsById = useMemo(() => new Map(posts.map((item) => [item.id, item])), [posts])
  const current = postsById.get(currentId) ?? postsById.get(routePostId) ?? posts[0]
  const text = drafts[current.id] ?? current.content
  const livePost = useMemo(() => ({ ...current, content: text }), [current, text])
  const livePosts = useMemo(
    () => posts.map((item) => (item.id === livePost.id ? livePost : item)),
    [posts, livePost]
  )

  const replacePost = useCallback((next: EditorPost) => {
    setPosts((list) => list.map((item) => (item.id === next.id && isNewer(next, item) ? next : item)))
  }, [])
  const replacePosts = useCallback((next: EditorPost[]) => next.forEach(replacePost), [replacePost])
  const handleGenerated = useCallback(
    (next: EditorPost) => {
      replacePost(next)
      setDrafts((all) => {
        if (!(next.id in all)) return all
        const rest = { ...all }
        delete rest[next.id]
        return rest
      })
    },
    [replacePost]
  )

  const autosave = useAutosave(current.id, replacePost, {
    onError: (_postId: string, patch: AutosavePatch) => {
      if (patch.scheduledAt !== undefined) setScheduleRevision((value) => value + 1)
    },
  })

  const getContext = useCallback(
    (postId: string) => {
      const target = postsById.get(postId)
      return target ? { post: target, series } : undefined
    },
    [postsById, series]
  )
  const generation = usePostGeneration(getContext)
  const queue = useSeriesGeneration({
    posts,
    autoStart: initialAutoStart,
    generation,
    onPostGenerated: handleGenerated,
  })

  const selectPost = useCallback(
    (postId: string) => {
      if (postId === currentId || !postsById.has(postId)) return
      setCurrentId(postId)
      window.history.pushState(null, "", postUrl(routePostId, postId))
    },
    [currentId, postsById, routePostId]
  )

  // Précédent / Suivant du navigateur.
  useEffect(() => {
    function onPopState() {
      if (window.location.pathname !== `/posts/${routePostId}`) return
      setCurrentId(new URLSearchParams(window.location.search).get(POST_PARAM) ?? routePostId)
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [routePostId])

  // La génération démarre une seule fois : un rechargement ne la relance pas.
  useEffect(() => {
    if (!initialAutoStart) return
    const url = new URL(window.location.href)
    if (!url.searchParams.has("generer")) return
    url.searchParams.delete("generer")
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`)
  }, [initialAutoStart])

  function changeText(next: string) {
    setDrafts((all) => ({ ...all, [current.id]: next }))
    autosave.schedule({ content: next })
  }

  const readOnly = isReadOnly(current)
  const queueStatus = queue.statusById[current.id]
  const busy =
    generation.activePostId === current.id || queueStatus === "queued" || queueStatus === "writing"
  const hashtagsWanted = parsePostParams(current.params).hashtags
  const report = useMemo(
    () => checkGuardrails(text, charter, { hashtagsWanted }),
    [text, charter, hashtagsWanted]
  )

  const imported = current.origin === "linkedin_import"
  const TagIcon = imported ? Import : current.series_id ? Files : PencilLine
  const tagLabel =
    series && current.series_id
      ? `Série · ${posts.length} ${posts.length > 1 ? "posts" : "post"}`
      : seriesLabel(current, series?.subject ?? null)
  const typeLabel = isPostTypeId(current.type) ? POST_TYPES[current.type].label : null
  const meta = [line?.name, typeLabel].filter(Boolean).join(" · ")

  return (
    <div className="grid min-w-0 gap-6">
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
        <h1 className="font-heading text-[32px]">{series?.subject || postTitle(current, 120)}</h1>
        {meta && <p className="text-sm text-muted-foreground">{meta}</p>}
      </header>

      {current.series_id && (
        <SeriesTimeline posts={livePosts} currentPostId={current.id} generation={queue} onSelect={selectPost} />
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-6">
        <PostEditorCard
          post={current}
          text={text}
          readOnly={readOnly}
          saveStatus={autosave.status}
          scheduleRevision={scheduleRevision}
          generation={generation}
          queue={queue}
          flush={autosave.flush}
          onTextChange={changeText}
          onScheduleChange={(scheduledAt) => autosave.schedule({ scheduledAt })}
          onPostChange={replacePost}
          onGenerated={handleGenerated}
        />
        <div className="grid min-w-0 gap-4">
          <PostStatusPanel post={current} connection={connection} />
          {!readOnly && <GuardrailChecklist report={report} />}
          <PostActions
            post={livePost}
            seriesPosts={livePosts}
            charter={charter}
            connection={connection}
            busy={busy}
            flush={autosave.flush}
            onSelect={selectPost}
            onReplace={replacePost}
            onReplaceMany={replacePosts}
          />
        </div>
      </div>
    </div>
  )
}
