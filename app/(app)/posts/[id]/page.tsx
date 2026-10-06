import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { z } from "zod"

import { PostWorkspace } from "@/components/posts/post-workspace"
import { getPostWorkspace } from "@/lib/creation-data"

export const metadata: Metadata = { title: "Édition du post" }

// `generer=1` : arrivée depuis E2, la série s'écrit post par post. `post` : post de la série
// ouvert depuis la frise, sans changer de chemin (voir PostWorkspace).
const searchSchema = z.object({
  generer: z.literal("1").optional().catch(undefined),
  post: z.uuid().optional().catch(undefined),
})

type PostPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

// Relecture et édition d'un post, un à la fois (E3).
export default async function PostPage({ params, searchParams }: PostPageProps) {
  const [{ id }, search] = await Promise.all([params, searchParams])
  const { generer, post: selectedId } = searchSchema.parse(search)

  const data =
    (selectedId && selectedId !== id ? await getPostWorkspace(selectedId) : null) ??
    (await getPostWorkspace(id))
  if (!data) notFound()

  return (
    <PostWorkspace
      {...data}
      initialPostId={data.post.id}
      routePostId={id}
      autoStart={generer === "1"}
    />
  )
}
