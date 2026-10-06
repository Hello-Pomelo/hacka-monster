import Link from "next/link"
import { TriangleAlert } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { failedBannerText } from "@/lib/creation"
import type { PostListFilters } from "@/lib/creation-data"
import { postsHref } from "@/lib/post-list"

type FailedPostsBannerProps = {
  // Posts en Échec sur toute la page, toutes lignes confondues.
  count: number
  filters: PostListFilters
}

// Le lien retire le filtre de ligne : la liste affiche alors les N posts annoncés.
export function FailedPostsBanner({ count, filters }: FailedPostsBannerProps) {
  const showsAllFailed = filters.status === "failed" && filters.line === "toutes"

  return (
    <Alert variant="destructive" className="border-0 bg-card text-destructive">
      <TriangleAlert aria-hidden className="size-4" />
      <AlertDescription className="flex flex-wrap items-baseline gap-x-2 text-destructive">
        <span className="font-medium">{failedBannerText(count)}</span>
        {!showsAllFailed && (
          <Link
            href={postsHref({ status: "failed", line: "toutes" })}
            scroll={false}
            className="font-medium text-link underline underline-offset-3"
          >
            Voir les échecs
          </Link>
        )}
      </AlertDescription>
    </Alert>
  )
}
