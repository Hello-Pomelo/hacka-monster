import { TabSkeleton } from "@/components/parametrage/tab-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const TAB_WIDTHS = ["w-36", "w-16", "w-14", "w-20", "w-14", "w-20"]

// Squelette de /parametrage : remplace celui de l'accueil (calendrier) hérité du groupe (app).
export default function ParametrageLoading() {
  return (
    <div aria-busy="true" aria-label="Chargement du paramétrage" className="grid min-w-0 gap-6">
      <div className="grid max-w-[720px] gap-3">
        <Skeleton className="h-6 w-44 rounded-full bg-chip" />
        <Skeleton className="h-8 w-80 bg-chip" />
        <Skeleton className="h-4 w-full max-w-[640px] bg-chip" />
      </div>

      <div className="flex h-10 items-center gap-5 border-b">
        {TAB_WIDTHS.map((width, i) => (
          <Skeleton key={i} className={cn("h-4 bg-chip", width)} />
        ))}
      </div>

      <TabSkeleton />
    </div>
  )
}
