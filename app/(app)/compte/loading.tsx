import { Skeleton } from "@/components/ui/skeleton"

const FIELDS = [0, 1, 2]

// Squelette de « Paramètres du compte » pendant la lecture du profil et des lignes.
export default function AccountLoading() {
  return (
    <div aria-busy="true" aria-label="Chargement des paramètres du compte" className="grid min-w-0 gap-6">
      <div className="grid max-w-[720px] gap-3">
        <Skeleton className="h-6 w-24 rounded-full bg-chip" />
        <Skeleton className="h-8 w-full max-w-[420px] bg-chip" />
      </div>

      <div className="grid max-w-[560px] gap-6 rounded-xl bg-card p-6">
        <div className="grid gap-5">
          {FIELDS.map((i) => (
            <div key={i} className="grid gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-28 justify-self-end" />
      </div>
    </div>
  )
}
