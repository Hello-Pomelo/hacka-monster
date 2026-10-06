import { CircleCheck, CircleX, TriangleAlert } from "lucide-react"

import { Card } from "@/components/ui/card"
import type { GuardrailReport } from "@/lib/guardrails"

// Contrôle de la charte affiché en checklist (spec Paramétrage, section 5) : un client non citable
// bloque la programmation, le reste est un avertissement.
export function GuardrailChecklist({ report }: { report: GuardrailReport }) {
  return (
    <Card className="gap-3 p-5 ring-0">
      <h2 className="font-heading text-lg">Charte</h2>
      {report.items.length === 0 ? (
        <p className="flex items-start gap-2 text-sm">
          <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
          Aucun point relevé par la charte.
        </p>
      ) : (
        <ul className="grid gap-2.5">
          {report.items.map((item, index) => (
            <li key={`${item.kind}-${index}`} className="flex items-start gap-2 text-sm">
              {item.severity === "blocking" ? (
                <CircleX aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" />
              ) : (
                <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
              )}
              <span>
                <span className="sr-only">
                  {item.severity === "blocking" ? "Bloquant : " : "Avertissement : "}
                </span>
                {item.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
