import { Skeleton } from "@/components/ui/skeleton"

// Squelette des statistiques à l'arrivée sur la page. Un changement de filtre garde
// l'écran précédent, atténué (StatsShell).
export default function StatsLoading() {
  return (
    <div aria-busy="true" aria-label="Chargement des statistiques" className="grid min-w-0 gap-6">
      <div className="grid max-w-[720px] gap-3">
        <Skeleton className="h-4 w-32 bg-chip" />
        <Skeleton className="h-8 w-full max-w-[420px] bg-chip" />
        <Skeleton className="h-4 w-full max-w-[480px] bg-chip" />
      </div>

      <Skeleton className="h-9 w-full max-w-[420px] bg-chip" />

      <div className="grid grid-cols-1 gap-3 min-[560px]:grid-cols-2 min-[900px]:gap-4 min-[1100px]:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="grid gap-3 rounded-xl bg-card p-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 min-[1100px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {[0, 1].map((i) => (
          <div key={i} className="grid gap-3 rounded-xl bg-card p-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-[280px] w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
