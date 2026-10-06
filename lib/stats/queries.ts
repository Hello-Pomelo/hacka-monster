import type { LineFilter } from "@/lib/calendar"
import { POST_TYPES, type PostTypeId } from "@/lib/post-types"
import { postTitle } from "@/lib/posts"
import { createClient } from "@/lib/supabase/server"

import type { PostStatsRow } from "./compute"

export function postTypeLabel(type: string): string {
  return type in POST_TYPES ? POST_TYPES[type as PostTypeId].label : "Autre"
}

// PostgREST tronque silencieusement au-delà de max_rows (1 000) : lecture page par page.
const PAGE_SIZE = 1000

// Posts publiés entre `from` (inclus) et `to` (exclu), avec leur dernier relevé LinkedIn.
// Date de publication : `published_at`, sinon `scheduled_at` (comme le calendrier).
export async function getPublishedPostStats({
  from,
  to,
  line,
}: {
  from: Date
  to: Date
  line: LineFilter
}): Promise<PostStatsRow[]> {
  const supabase = await createClient()

  const { data: lines, error: linesError } = await supabase.from("editorial_lines").select("id, code, name")
  if (linesError) throw new Error(`Lecture des lignes éditoriales impossible : ${linesError.message}`)
  const lineNames = new Map(lines.map((editorialLine) => [editorialLine.id, editorialLine.name]))
  const lineId = line === "toutes" ? null : (lines.find((editorialLine) => editorialLine.code === line)?.id ?? null)
  if (line !== "toutes" && !lineId) return []

  const fromIso = from.toISOString()
  const toIso = to.toISOString()
  const inPeriod = [
    `and(published_at.gte."${fromIso}",published_at.lt."${toIso}")`,
    `and(published_at.is.null,scheduled_at.gte."${fromIso}",scheduled_at.lt."${toIso}")`,
  ].join(",")

  const posts = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    let query = supabase
      .from("posts")
      .select(
        "id, type, sujet, content, published_at, scheduled_at, editorial_line_id, author:profiles!posts_author_id_fkey(nom), post_metrics(captured_on, impressions, members_reached, reactions, comments, reposts, clicks)"
      )
      .eq("status", "published")
      .or(inPeriod)
      .order("id")
      .order("captured_on", { referencedTable: "post_metrics", ascending: false })
      .limit(1, { referencedTable: "post_metrics" })
      .range(offset, offset + PAGE_SIZE - 1)
    if (lineId) query = query.eq("editorial_line_id", lineId)

    const { data, error } = await query
    if (error) throw new Error(`Lecture des statistiques impossible : ${error.message}`)
    posts.push(...data)
    if (data.length < PAGE_SIZE) break
  }

  return posts.flatMap((post) => {
    const publishedAt = post.published_at ?? post.scheduled_at
    if (!publishedAt) return []
    const [latest] = post.post_metrics
    return {
      id: post.id,
      title: postTitle(post, 90),
      type: post.type,
      lineName: post.editorial_line_id ? (lineNames.get(post.editorial_line_id) ?? null) : null,
      authorName: post.author?.nom ?? "",
      publishedAt,
      metrics: latest
        ? {
            capturedOn: latest.captured_on,
            impressions: latest.impressions,
            membersReached: latest.members_reached,
            reactions: latest.reactions,
            comments: latest.comments,
            reposts: latest.reposts,
            clicks: latest.clicks,
          }
        : null,
    }
  })
}
