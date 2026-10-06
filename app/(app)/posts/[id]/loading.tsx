import { Skeleton } from "@/components/ui/skeleton"

const MARKERS = [0, 1, 2, 3]

// Squelette de l'édition d'un post (E3) pendant la lecture du post et de sa série.
export default function PostLoading() {
  return (
    <div aria-busy="true" aria-label="Chargement du post" className="grid min-w-0 gap-6">
      <div className="grid gap-3">
        <Skeleton className="h-4 w-28 bg-chip" />
        <Skeleton className="h-6 w-40 rounded-full bg-chip" />
        <Skeleton className="h-8 w-full max-w-[520px] bg-chip" />
      </div>

      <div className="flex gap-2 overflow-hidden">
        {MARKERS.map((marker) => (
          <Skeleton key={marker} className="h-14 w-[150px] shrink-0 rounded-lg bg-chip" />
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-6">
        <div className="grid gap-5 rounded-xl bg-card p-6">
          <Skeleton className="h-5 w-16" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <Skeleton className="h-[320px] w-full rounded-lg" />
          <Skeleton className="h-10 w-44" />
        </div>

        <div className="grid gap-4">
          <div className="grid gap-3 rounded-xl bg-card p-5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="grid gap-3 rounded-xl bg-card p-5">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="grid gap-2.5 rounded-xl bg-card p-5">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
