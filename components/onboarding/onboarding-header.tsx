import { Sparkles } from "lucide-react"

export function OnboardingHeader() {
  return (
    <header className="grid max-w-[720px] min-w-0 gap-3">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-tag-border bg-tag px-2.5 py-1 text-xs font-medium tracking-[0.06em] text-tag-foreground uppercase">
        <Sparkles aria-hidden="true" className="size-4" />
        Première connexion
      </span>
      <h1 className="font-heading text-[32px]">{"Configurez l'outil en quelques minutes"}</h1>
      <p className="text-muted-foreground">
        {
          "Chaque étape peut être passée et reprise plus tard depuis « Paramétrage rédaction ». Sans paramétrage, l'IA écrit avec une ligne neutre."
        }
      </p>
    </header>
  )
}
