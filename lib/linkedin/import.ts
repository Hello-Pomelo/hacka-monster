import "server-only"

import { normalizeForMatch } from "@/lib/parametrage/guardrails"
import type { PostTypeId } from "@/lib/post-types"
import { MAX_POST_LENGTH } from "@/lib/posts"
import type { TablesInsert } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

import { markImported } from "./connection"
import { IMPORT_MAX_MONTHS, IMPORT_MAX_POSTS, type ImportResult, type RemotePost } from "./types"

// LinkedIn ne donne pas de type de post : le type d'un post importé est deviné par mots-clés.
const TYPE_KEYWORDS: [PostTypeId, RegExp][] = [
  ["newcomer", /bienvenue|rejoint/],
  ["hiring", /recrut|postuler|\bcdi\b/],
  ["event", /meetup|conference|salon|webinar/],
  ["project_delivered", /livr|client|projet/],
  ["tech_feedback", /retour d'experience|migration|bug|technique/],
]

export function guessPostType(text: string): PostTypeId {
  const normalized = normalizeForMatch(text)
  return TYPE_KEYWORDS.find(([, pattern]) => pattern.test(normalized))?.[0] ?? "employer_brand"
}

function monthsAgo(months: number, from: Date): Date {
  const date = new Date(from)
  date.setMonth(date.getMonth() - months)
  return date
}

// Importe les posts de la page : 50 au plus, sur 12 mois au plus (D23), sans doublon.
// Les posts importés sont Publiés et en lecture seule (trigger `posts_check_update`).
export async function importPosts(input: {
  posts: RemotePost[]
  authorId: string
  lineId: string | null
}): Promise<ImportResult> {
  const since = monthsAgo(IMPORT_MAX_MONTHS, new Date()).getTime()
  const byUrn = new Map<string, RemotePost>()
  for (const post of input.posts) {
    const publishedAt = Date.parse(post.publishedAt)
    if (!Number.isNaN(publishedAt) && publishedAt >= since && !byUrn.has(post.urn)) {
      byUrn.set(post.urn, post)
    }
  }
  const selected = [...byUrn.values()]
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, IMPORT_MAX_POSTS)

  const supabase = await createClient()
  let imported = 0
  let skipped = 0

  if (selected.length > 0) {
    const { data: existing, error: readError } = await supabase
      .from("posts")
      .select("linkedin_post_urn")
      .in(
        "linkedin_post_urn",
        selected.map((post) => post.urn)
      )
    if (readError) throw new Error("L'import des posts a échoué.")

    const known = new Set(existing.map((row) => row.linkedin_post_urn))
    const rows: TablesInsert<"posts">[] = selected
      .filter((post) => !known.has(post.urn))
      .map((post) => ({
        author_id: input.authorId,
        type: guessPostType(post.text),
        sujet: "",
        content: post.text.slice(0, MAX_POST_LENGTH),
        status: "published",
        origin: "linkedin_import",
        cible: "entreprise",
        published_at: post.publishedAt,
        linkedin_post_urn: post.urn,
        linkedin_url: post.url,
        editorial_line_id: input.lineId,
        // Aucune colonne ne porte la présence d'une image sur un post importé.
        answers: post.hasImage ? { linkedin_has_image: "true" } : {},
      }))

    if (rows.length > 0) {
      const { error } = await supabase.from("posts").insert(rows)
      if (error) throw new Error("L'import des posts a échoué.")
    }
    imported = rows.length
    skipped = selected.length - rows.length
  }

  await markImported(new Date())
  return { imported, skipped }
}
