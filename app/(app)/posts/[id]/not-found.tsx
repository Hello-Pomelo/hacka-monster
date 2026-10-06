import Link from "next/link"
import { FileQuestion } from "lucide-react"

import { PageFallback } from "@/components/posts/page-fallback"
import { Button } from "@/components/ui/button"

// Identifiant invalide ou post introuvable (E3).
export default function PostNotFound() {
  return (
    <PageFallback
      icon={FileQuestion}
      tone="neutral"
      title="Ce post n'existe pas"
      description="Il a peut-être été supprimé, ou le lien est incomplet."
    >
      <Button className="h-10 px-4" nativeButton={false} render={<Link href="/posts" />}>
        Tous les posts
      </Button>
    </PageFallback>
  )
}
