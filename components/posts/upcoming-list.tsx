import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { postInstant } from "@/components/posts/post-card"
import { StatusBadge } from "@/components/posts/status-badge"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { postTitle, type Post } from "@/lib/posts"
import { dayOfMonth, monthShort, parisDay, parisTime } from "@/lib/suggestions"

type UpcomingListProps = {
  posts: Post[]
  lineNames: Map<string, string>
}

// Posts non publiés à partir d'aujourd'hui, déjà filtrés et triés par l'appelant.
export function UpcomingList({ posts, lineNames }: UpcomingListProps) {
  return (
    <div className="grid gap-3">
      {posts.length > 0 ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,360px),1fr))] gap-x-8 rounded-xl bg-card px-4">
          {posts.map((post) => {
            const instant = postInstant(post)
            const day = parisDay(instant)
            const lineName = post.editorial_line_id ? lineNames.get(post.editorial_line_id) : undefined
            return (
              <li key={post.id}>
                <Link
                  href={`/?jour=${day}`}
                  scroll={false}
                  className="group grid grid-cols-[44px_minmax(0,1fr)] items-start gap-3 border-b py-3"
                >
                  <span className="grid justify-items-center gap-0.5 rounded-lg bg-page py-1.5">
                    <b className="font-heading text-xl leading-none font-medium tabular-nums">
                      {dayOfMonth(day)}
                    </b>
                    <small className="text-[11px] tracking-[0.04em] text-subtle-foreground uppercase">
                      {monthShort(day)}
                    </small>
                  </span>
                  <span className="grid min-w-0 gap-1.5">
                    <span className="leading-[1.3] font-medium group-hover:text-link">{postTitle(post)}</span>
                    <span className="flex flex-wrap items-center gap-1.5 text-xs text-subtle-foreground">
                      <StatusBadge post={post} />
                      {[lineName, parisTime(instant)].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <Empty className="rounded-xl bg-card">
          <EmptyHeader>
            <EmptyDescription>Aucun post à venir.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      <Link href="/posts" className="inline-flex items-center gap-1 text-sm text-link hover:underline">
        Voir tous les posts
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </div>
  )
}
