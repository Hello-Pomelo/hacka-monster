import Link from "next/link"
import { ExternalLink, TriangleAlert } from "lucide-react"

import { LinkedInMissingBanner } from "@/components/posts/creation-banners"
import { StatusBadge } from "@/components/posts/status-badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  CONNECTION_SETTINGS_HREF,
  CREATION_TEXTS,
  type EditorPost,
  type LinkedInConnectionSummary,
} from "@/lib/creation"
import { isReadOnly } from "@/lib/posts"
import { formatPlannedDate, isoToParis } from "@/lib/series"

type PostStatusPanelProps = {
  post: EditorPost
  connection: LinkedInConnectionSummary | null
}

function dateLine(post: EditorPost): { label: string; value: string | null } {
  if (post.status === "published") {
    const iso = post.published_at ?? post.scheduled_at
    return { label: "Publié le", value: iso ? formatIso(iso) : null }
  }
  return {
    label: "Publication prévue le",
    value: post.scheduled_at ? formatIso(post.scheduled_at) : null,
  }
}

function formatIso(iso: string): string {
  const { day, time } = isoToParis(iso)
  return formatPlannedDate(day, time)
}

// Phrase qui explique pourquoi le post ne se modifie plus.
function readOnlyReason(post: EditorPost): string | null {
  if (post.origin === "linkedin_import") return "Importé de LinkedIn, en lecture seule."
  if (post.status === "publishing") return "Publication en cours : le post est en lecture seule."
  if (post.status === "archived") return "Archivé : restaurez-le pour le modifier."
  return null
}

// Statut du post courant (E3) : badge, date, motif d'échec, lien LinkedIn, état de la connexion.
export function PostStatusPanel({ post, connection }: PostStatusPanelProps) {
  const editable = !isReadOnly(post)
  const { label, value } = dateLine(post)
  const reason = readOnlyReason(post)
  const tokenExpiresFirst =
    editable &&
    Boolean(connection?.expiresAt && post.scheduled_at) &&
    Date.parse(connection?.expiresAt ?? "") < Date.parse(post.scheduled_at ?? "")

  return (
    <Card className="gap-3 p-5 ring-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-lg">Statut</h2>
        <StatusBadge post={post} />
      </div>

      <p className="text-sm">
        {value ? (
          <>
            <span className="text-subtle-foreground">{label} </span>
            {value}
          </>
        ) : (
          <span className="text-subtle-foreground">Non planifiée</span>
        )}
      </p>

      {reason && <p className="text-sm text-muted-foreground">{reason}</p>}

      {post.status === "failed" && (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden />
          <AlertTitle>Échec de la publication</AlertTitle>
          <AlertDescription>{post.failure_reason || "La publication a échoué."}</AlertDescription>
        </Alert>
      )}

      {post.status === "published" && post.linkedin_url && (
        <Button
          variant="secondary"
          size="sm"
          className="w-fit"
          nativeButton={false}
          render={<a href={post.linkedin_url} target="_blank" rel="noreferrer" />}
        >
          <ExternalLink aria-hidden />
          Voir sur LinkedIn
        </Button>
      )}

      {editable && !connection && <LinkedInMissingBanner />}

      {tokenExpiresFirst && (
        <Alert className="border-0 bg-warning-surface text-warning">
          <TriangleAlert aria-hidden />
          <AlertDescription className="flex flex-wrap items-baseline gap-x-2 text-warning">
            <span>{CREATION_TEXTS.tokenExpired}</span>
            <Link
              href={CONNECTION_SETTINGS_HREF}
              className="font-medium text-link underline underline-offset-3"
            >
              Reconnecter la page
            </Link>
          </AlertDescription>
        </Alert>
      )}
    </Card>
  )
}
