import { Check } from "lucide-react"
import Link from "next/link"

import { Progress, ProgressLabel } from "@/components/ui/progress"
import {
  ONBOARDING_STEP_LABELS,
  ONBOARDING_STEPS,
  onboardingHref,
  type OnboardingStep,
} from "@/lib/parametrage/types"
import { cn } from "@/lib/utils"

type StepState = "done" | "current" | "next"

const LINK_CLASS: Record<StepState, string> = {
  done: "text-muted-foreground",
  current: "font-medium text-foreground",
  next: "text-subtle-foreground",
}

const MARK_CLASS: Record<StepState, string> = {
  done: "bg-success-surface text-success",
  current: "bg-primary text-primary-foreground",
  next: "bg-chip text-chip-foreground",
}

// Progression de l'assistant : chaque étape reste accessible, même passée (US1).
export function OnboardingProgress({ step }: { step: OnboardingStep }) {
  const index = ONBOARDING_STEPS.indexOf(step)
  const total = ONBOARDING_STEPS.length

  return (
    <nav aria-label="Étapes de la configuration" className="grid gap-4 rounded-xl bg-card p-4">
      <Progress
        value={((index + 1) / total) * 100}
        className="gap-2 *:data-[slot=progress-track]:h-1.5 *:data-[slot=progress-track]:bg-chip"
      >
        <ProgressLabel>{`Étape ${index + 1} sur ${total} · ${ONBOARDING_STEP_LABELS[step]}`}</ProgressLabel>
      </Progress>

      <ol className="grid grid-cols-4 gap-2">
        {ONBOARDING_STEPS.map((item, itemIndex) => {
          const state: StepState =
            itemIndex < index ? "done" : itemIndex === index ? "current" : "next"

          return (
            <li key={item} className="min-w-0">
              <Link
                href={onboardingHref(item)}
                aria-current={state === "current" ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg py-1 pr-2 text-sm outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                  LINK_CLASS[state]
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                    MARK_CLASS[state]
                  )}
                >
                  {state === "done" ? <Check aria-hidden="true" className="size-3.5" /> : itemIndex + 1}
                </span>
                <span className="truncate">{ONBOARDING_STEP_LABELS[item]}</span>
              </Link>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
