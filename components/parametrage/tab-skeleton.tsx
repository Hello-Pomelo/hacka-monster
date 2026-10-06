import { Skeleton } from "@/components/ui/skeleton"

// Squelette du contenu d'un onglet de /parametrage : titre, puis deux cartes.
export function TabSkeleton() {
  return (
    <div aria-busy="true" aria-label="Chargement de l'onglet" className="grid min-w-0 gap-4">
      <div className="grid max-w-[720px] gap-2">
        <Skeleton className="h-7 w-48 bg-chip" />
        <Skeleton className="h-4 w-full max-w-[560px] bg-chip" />
      </div>

      {[0, 1].map((card) => (
        <div key={card} className="grid gap-4 rounded-xl bg-card p-4">
          <div className="grid gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full max-w-[480px]" />
          </div>
          <div className="grid gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
