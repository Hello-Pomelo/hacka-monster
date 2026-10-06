import { SlidersHorizontal } from "lucide-react"

// En-tête de l'espace Paramétrage (spec Paramétrage, E2), sur le modèle de l'accueil.
export function ParametrageHeader() {
  return (
    <header className="grid max-w-[720px] min-w-0 gap-3">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-tag-border bg-tag px-2.5 py-1 text-xs font-medium tracking-[0.06em] text-tag-foreground uppercase">
        <SlidersHorizontal aria-hidden className="size-4" />
        Paramétrage rédaction
      </span>
      <h1 className="font-heading text-[32px]">Paramétrage rédaction</h1>
      <p className="max-w-[720px] text-muted-foreground">
        La charte s&apos;impose à tous les posts. Chaque ligne éditoriale définit qui vous êtes et
        comment vous sonnez. Les modifications sont enregistrées automatiquement.
      </p>
    </header>
  )
}
