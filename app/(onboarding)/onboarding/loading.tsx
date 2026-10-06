import { StepSkeleton } from "@/components/onboarding/step-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

// Squelette de l'onboarding : en-tête, progression, contenu de l'étape.
export default function OnboardingLoading() {
  return (
    <div aria-busy="true" aria-label="Chargement de la configuration" className="grid min-w-0 gap-6">
      <div className="grid max-w-[720px] gap-3">
        <Skeleton className="h-6 w-40 rounded-full bg-chip" />
        <Skeleton className="h-8 w-full max-w-[560px] bg-chip" />
        <Skeleton className="h-4 w-full max-w-[640px] bg-chip" />
      </div>

      <div className="grid gap-4 rounded-xl bg-card p-4">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </div>

      <StepSkeleton />
    </div>
  )
}
