import { ExternalLink, PencilLine } from "lucide-react"
import Link from "next/link"

import { StatusBadge } from "@/components/posts/status-badge"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { postHref, safeLinkedInUrl, type CalendarPost } from "@/lib/calendar"
import { isPostTypeId, POST_TYPES } from "@/lib/post-types"
import { postTitle } from "@/lib/posts"

type PostCardProps = {
  post: CalendarPost
  lineName: string | null
}

// Carte d'un post dans la vue jour (spec Mon calendrier 3.5). Un post importé de LinkedIn
// n'a ni ligne ni gabarit : il porte le libellé du contrat 6.
export function PostCard({ post, lineName }: PostCardProps) {
  const typeLabel = isPostTypeId(post.type) ? POST_TYPES[post.type].label : null
  const meta =
    post.origin === "linkedin_import"
      ? "Importé de LinkedIn"
      : [lineName, typeLabel].filter(Boolean).join(" · ")
  const linkedinUrl = post.status === "published" ? safeLinkedInUrl(post.linkedin_url) : null
  const failureReason = post.status === "failed" ? post.failure_reason : null

  return (
    <Card className="gap-2.5 px-4 py-4 ring-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusBadge post={post} />
        <span className="text-[13px] font-medium tabular-nums">{post.time}</span>
      </div>
      <h3 className="text-lg leading-[1.1]">{postTitle(post)}</h3>
      {meta && <span className="text-xs text-subtle-foreground">{meta}</span>}
      {failureReason && <p className="text-sm text-destructive">{failureReason}</p>}
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
          <Link href={postHref(post.id)} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <PencilLine aria-hidden />
            Ouvrir le post
          </Link>
        )}
      </div>
    </Card>
  )
}
