import { Skeleton } from "@/components/ui/skeleton"

const CELLS = Array.from({ length: 35 }, (_, i) => i)

// Squelette de l'accueil « Mon calendrier » pendant la lecture des posts.
export default function HomeLoading() {
  return (
    <div aria-busy="true" aria-label="Chargement du calendrier" className="grid min-w-0 gap-6">
      <div className="grid max-w-[720px] gap-3">
        <Skeleton className="h-4 w-32 bg-chip" />
        <Skeleton className="h-8 w-full max-w-[560px] bg-chip" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid gap-3 rounded-xl bg-card p-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>

      <div className="grid gap-3 rounded-xl bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-72" />
        </div>
        <div className="grid grid-cols-7 overflow-hidden rounded-xl border">
          {CELLS.map((i) => (
            <div
              key={i}
              className="min-h-[118px] border-r border-b p-1.5 nth-[7n]:border-r-0"
            >
              <Skeleton className="size-6 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <Skeleton className="h-10 w-full bg-chip" />
        <Skeleton className="h-32 w-full rounded-xl bg-card" />
      </div>
    </div>
  )
}
