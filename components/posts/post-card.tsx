import { ExternalLink, PencilLine } from "lucide-react"
import Link from "next/link"

import { StatusBadge } from "@/components/posts/status-badge"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { POST_TYPE_IDS, POST_TYPES, type PostTypeId } from "@/lib/post-types"
import { postTitle, type Post } from "@/lib/posts"
import { parisTime } from "@/lib/suggestions"

function isPostTypeId(type: string): type is PostTypeId {
  return (POST_TYPE_IDS as readonly string[]).includes(type)
}

// Instant affiché d'un post : diffusion prévue, sinon publication, sinon création.
export function postInstant(post: Pick<Post, "scheduled_at" | "published_at" | "created_at">): string {
  return post.scheduled_at ?? post.published_at ?? post.created_at
}

type PostCardProps = {
  post: Post
  lineName: string | null
}

// Carte d'un post dans la vue du jour sélectionné.
export function PostCard({ post, lineName }: PostCardProps) {
  const typeLabel = isPostTypeId(post.type) ? POST_TYPES[post.type].label : null
  const linkedinUrl = post.status === "published" ? post.linkedin_url : null
  const meta = [lineName, typeLabel].filter(Boolean).join(" · ")

  return (
    <Card className="gap-2.5 px-4 py-4 ring-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusBadge post={post} />
        <span className="text-[13px] font-medium tabular-nums">{parisTime(postInstant(post))}</span>
      </div>
      <h3 className="text-lg leading-[1.1]">{postTitle(post)}</h3>
      {meta && <span className="text-xs text-subtle-foreground">{meta}</span>}
      <div className="mt-0.5 flex flex-wrap gap-2">
        {linkedinUrl ? (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <ExternalLink aria-hidden />
            Voir sur LinkedIn
          </a>
        ) : (
          <Link href={`/posts/${post.id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <PencilLine aria-hidden />
            Ouvrir le post
          </Link>
        )}
      </div>
    </Card>
  )
}
