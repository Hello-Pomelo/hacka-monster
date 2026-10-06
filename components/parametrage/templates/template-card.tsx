import { ChevronRight } from "lucide-react"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  LENGTH_LABELS,
  TONE_LABELS,
  type PostParams,
  type PostTemplate,
  type PostTypeId,
} from "@/lib/post-types"
import { cn } from "@/lib/utils"

const LABEL_CLASS = "text-[11px] font-medium tracking-[0.06em] text-subtle-foreground uppercase"
const BADGE_CLASS = "h-[22px] text-[11px] tracking-[0.05em] uppercase"

// Réglages imposés par le gabarit ; les réglages absents viennent de la ligne éditoriale.
function defaultChips(defaults: Partial<PostParams>): string[] {
  const chips: string[] = []
  if (defaults.tone) chips.push(`Ton : ${TONE_LABELS[defaults.tone]}`)
  if (defaults.length) chips.push(`Longueur : ${LENGTH_LABELS[defaults.length]}`)
  if (defaults.emojis !== undefined) chips.push(defaults.emojis ? "Emojis" : "Sans emojis")
  if (defaults.hashtags !== undefined) chips.push(defaults.hashtags ? "Hashtags" : "Sans hashtags")
  if (defaults.cta) chips.push(`Appel à l'action : ${defaults.cta}`)
  return chips
}

function Term({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className={LABEL_CLASS}>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

type TemplateCardProps = {
  id: PostTypeId
  template: PostTemplate
}

// Gabarit d'un type de post, en lecture seule (spec Paramétrage, section 4 et D21).
export function TemplateCard({ id, template }: TemplateCardProps) {
  const chips = defaultChips(template.defaults)
  const questionsId = `template-${id}-questions`
  const defaultsId = `template-${id}-defaults`

  return (
    <Card className="min-w-0 ring-0">
      <CardHeader>
        <CardTitle>{template.label}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
        <CardAction>
          <Badge
            variant="secondary"
            className={cn(
              BADGE_CLASS,
              template.detailed ? "bg-tag text-tag-foreground" : "bg-chip text-chip-foreground"
            )}
          >
            {template.detailed ? "Détaillé" : "Générique"}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-4">
        <dl className="grid gap-3">
          <Term label="Objectif">{template.objective}</Term>
          <Term label="Public">{template.audience}</Term>
          <Term label="Structure">
            {template.structure.charAt(0).toUpperCase() + template.structure.slice(1)}.
          </Term>
        </dl>

        <div className="grid gap-1.5">
          <p id={questionsId} className={LABEL_CLASS}>
            Questions guidées
          </p>
          <ol
            aria-labelledby={questionsId}
            className="grid list-decimal gap-1 pl-5 marker:text-subtle-foreground"
          >
            {template.questions.map((question) => (
              <li key={question.id}>{question.label}</li>
            ))}
          </ol>
        </div>

        <div className="grid gap-1.5">
          <p id={defaultsId} className={LABEL_CLASS}>
            Réglages par défaut
          </p>
          {chips.length > 0 ? (
            <ul aria-labelledby={defaultsId} className="flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <li
                  key={chip}
                  className="rounded-full bg-chip px-2.5 py-0.5 text-xs text-chip-foreground"
                >
                  {chip}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-subtle-foreground">Aucun</p>
          )}
        </div>

        {template.examplePost && (
          <details className="group">
            <summary className="flex w-fit cursor-pointer list-none items-center gap-1 rounded-sm font-medium text-link hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
              <ChevronRight
                aria-hidden
                className="size-4 transition-transform group-open:rotate-90"
              />
              Voir l&apos;exemple
            </summary>
            <p className="mt-2 rounded-xl bg-page p-4 whitespace-pre-wrap">{template.examplePost}</p>
          </details>
        )}
      </CardContent>
    </Card>
  )
}
