import { FileQuestion } from "lucide-react"

import { NewPostButton } from "@/components/posts/new-post-button"
import { PageFallback } from "@/components/posts/page-fallback"

// Identifiant invalide ou série introuvable (E2).
export default function SeriesNotFound() {
  return (
    <PageFallback
      icon={FileQuestion}
      tone="neutral"
      title="Cette série n'existe pas"
      description="Le lien est peut-être incomplet. Vous pouvez créer un nouveau post."
    >
      <NewPostButton className="h-10 px-4">Nouveau post</NewPostButton>
    </PageFallback>
  )
}
