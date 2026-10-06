import { TemplateCard } from "@/components/parametrage/templates/template-card"
import { POST_TYPE_IDS, POST_TYPES } from "@/lib/post-types"

// Onglet Gabarits : les 6 types de post de `lib/post-types.ts`, en lecture seule (D21).
export function TemplatesTab() {
  return (
    <section aria-labelledby="templates-title" className="grid min-w-0 gap-4">
      <header className="grid max-w-[720px] gap-1">
        <h2 id="templates-title" className="font-heading text-2xl">
          Gabarits
        </h2>
        <p className="text-muted-foreground">
          Un gabarit par type de post : structure, questions guidées et réglages par défaut. La
          liste vient du code ({POST_TYPE_IDS.length} types) ; l&apos;édition des gabarits n&apos;est
          pas encore disponible.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        {POST_TYPE_IDS.map((id) => (
          <TemplateCard key={id} id={id} template={POST_TYPES[id]} />
        ))}
      </div>
    </section>
  )
}
