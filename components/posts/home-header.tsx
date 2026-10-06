import { CalendarDays } from "lucide-react"

// Prénom d'accueil : premier mot du nom, ou de la partie avant @ si le nom est un e-mail.
function firstName(nom: string): string {
  const isEmail = nom.includes("@")
  const base = isEmail ? nom.slice(0, nom.indexOf("@")) : nom
  const first = base.trim().split(isEmail ? /[\s._-]+/ : /\s+/)[0] ?? ""
  return first.charAt(0).toUpperCase() + first.slice(1)
}

function scheduledLabel(count: number): string {
  if (count === 0) return "aucun post programmé"
  return count > 1 ? `${count} posts programmés` : "1 post programmé"
}

type HomeHeaderProps = {
  name: string
  // Posts programmés entre maintenant et dans un mois ; null si les posts n'ont pas pu être lus.
  scheduledCount: number | null
}

export function HomeHeader({ name, scheduledCount }: HomeHeaderProps) {
  const first = firstName(name)
  const greeting = first ? `Bonjour ${first}` : "Bonjour"

  return (
    <header className="grid max-w-[720px] min-w-0 gap-3">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-tag-border bg-tag px-2.5 py-1 text-xs font-medium tracking-[0.06em] text-tag-foreground uppercase">
        <CalendarDays aria-hidden className="size-4" />
        Mon calendrier
      </span>
      <h1 className="font-heading text-[32px]">
        {greeting}
        {scheduledCount !== null && (
          <>
            , <span className="text-highlight">{scheduledLabel(scheduledCount)}</span> dans le
            prochain mois
          </>
        )}
      </h1>
    </header>
  )
}
