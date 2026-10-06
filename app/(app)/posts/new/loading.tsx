import { Skeleton } from "@/components/ui/skeleton"

const TYPE_CARDS = Array.from({ length: 6 }, (_, i) => i)

// Squelette de E1 « Nouveau post » pendant la lecture des lignes et de la connexion LinkedIn.
export default function NewPostLoading() {
  return (
    <div aria-busy="true" aria-label="Chargement du nouveau post" className="grid min-w-0 gap-6">
      <div className="grid max-w-[760px] gap-3">
        <Skeleton className="h-6 w-32 rounded-full bg-chip" />
        <Skeleton className="h-8 w-[420px] max-w-full bg-chip" />
        <Skeleton className="h-4 w-full max-w-[560px] bg-chip" />
      </div>

      <div className="grid max-w-[760px] gap-6 rounded-xl bg-card p-6">
        <div className="grid gap-3">
          <Skeleton className="h-4 w-56" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-[72px] rounded-xl" />
            <Skeleton className="h-[72px] rounded-xl" />
          </div>
        </div>

        <div className="grid gap-3">
          <Skeleton className="h-4 w-24" />
          <div className="grid grid-cols-3 gap-2">
            {TYPE_CARDS.map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-16 w-full" />
        </div>

        <div className="flex justify-end gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-64" />
        </div>
      </div>
    </div>
  )
}
