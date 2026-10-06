import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const ROWS = Array.from({ length: 8 }, (_, i) => i)
const COLUMNS = "grid grid-cols-[150px_110px_minmax(0,1fr)_180px_90px_48px] items-center gap-6 px-4"

// Squelette de « Tous les posts » pendant la lecture de la liste.
export default function PostsLoading() {
  return (
    <div aria-busy="true" aria-label="Chargement des posts" className="grid min-w-0 gap-6">
      <div className="flex items-end justify-between gap-4">
        <div className="grid gap-3">
          <Skeleton className="h-6 w-36 rounded-full bg-chip" />
          <Skeleton className="h-8 w-[280px] bg-chip" />
        </div>
        <Skeleton className="h-10 w-36 bg-chip" />
      </div>

      <div className="flex items-center gap-6">
        <Skeleton className="h-8 w-[250px] bg-chip" />
        <Skeleton className="h-8 w-[230px] bg-chip" />
      </div>

      <div className="overflow-hidden rounded-xl bg-card">
        <div className={cn(COLUMNS, "h-10 border-b")}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-3 w-14" />
          ))}
        </div>
        {ROWS.map((i) => (
          <div key={i} className={cn(COLUMNS, "border-b py-3.5 last:border-b-0")}>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-[22px] w-24" />
            <Skeleton className="h-4 w-full max-w-[420px]" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="mx-auto size-4" />
          </div>
        ))}
      </div>
    </div>
  )
}
