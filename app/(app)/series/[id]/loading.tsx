import { Skeleton } from "@/components/ui/skeleton"

// Squelette de E2 « Paramètres de la série » : blocs du formulaire et panneau « Dates prévues ».
export default function SeriesLoading() {
  return (
    <div aria-busy="true" aria-label="Chargement des paramètres de la série" className="grid min-w-0 gap-6">
      <div className="grid gap-3">
        <Skeleton className="h-6 w-36 rounded-full bg-chip" />
        <Skeleton className="h-8 w-full max-w-[420px] bg-chip" />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-6">
        <div className="grid min-w-0 gap-6">
          <div className="grid gap-4 rounded-xl bg-card p-5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="grid gap-4 rounded-xl bg-card p-5">
            <Skeleton className="h-5 w-36" />
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-24" />
              ))}
            </div>
          </div>
          <div className="grid gap-2 rounded-xl bg-card p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-72" />
          </div>
          <div className="grid gap-4 rounded-xl bg-card p-5">
            <Skeleton className="h-5 w-28" />
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
            <Skeleton className="h-4 w-full max-w-[560px]" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 rounded-xl bg-card p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-20" />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 w-40" />
          ))}
        </div>
      </div>
    </div>
  )
}
