import { Card } from "@/components/ui/card"
import { formatPlannedDateShort, type SchedulePlan } from "@/lib/series"

function postCountLabel(count: number): string {
  return count > 1 ? `${count} posts` : `${count} post`
}

// Panneau latéral « Dates prévues » de E2 : nombre de posts et dates calculées, recalculés à chaque
// changement, avant tout appel à l'IA (spec Création de post, P0 2).
export function SeriesDatesPanel({ plan }: { plan: SchedulePlan }) {
  const count = plan.posts.length

  return (
    <Card className="sticky top-8 gap-4 p-5 ring-0">
      <h2 className="font-heading text-lg">Dates prévues</h2>
      <p aria-live="polite" className="font-heading text-[24px] leading-none tabular-nums">
        {postCountLabel(count)}
      </p>

      {plan.errors.series ? (
        <p className="text-sm text-destructive">{plan.errors.series}</p>
      ) : count === 0 ? (
        <p className="text-sm text-subtle-foreground">Aucune date pour l&apos;instant.</p>
      ) : (
        <ol className="grid max-h-[60vh] gap-1.5 overflow-y-auto text-sm tabular-nums">
          {plan.posts.map((post) => (
            <li key={post.iso} className="first-letter:uppercase">
              {formatPlannedDateShort(post.day, post.time)}
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
