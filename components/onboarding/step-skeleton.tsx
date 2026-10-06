import { Skeleton } from "@/components/ui/skeleton"

// Squelette du contenu d'une étape de l'onboarding, pendant la lecture des données.
export function StepSkeleton() {
  return (
    <div aria-busy="true" aria-label="Chargement de l'étape" className="grid gap-4">
      {[0, 1].map((i) => (
        <div key={i} className="grid gap-4 rounded-xl bg-card p-6">
          <div className="grid gap-2">
            <Skeleton className="h-6 w-60" />
            <Skeleton className="h-4 w-full max-w-[520px]" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-48" />
        </div>
      ))}
    </div>
  )
}
