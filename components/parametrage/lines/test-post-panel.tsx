"use client"

import { useState, useTransition } from "react"
import { Check, RefreshCw, Sparkles, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { generateTestPostAction } from "@/app/(app)/parametrage/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import type { GuardrailReport } from "@/lib/parametrage/guardrails"
import { TEST_MATERIAL } from "@/lib/parametrage/presets"
import { POST_TYPES } from "@/lib/post-types"

type TestPostPanelProps = {
  lineId: string
  lineName: string
}

type TestPost = { text: string; report: GuardrailReport }

const SKELETON_WIDTHS = ["w-11/12", "w-full", "w-4/5", "w-full", "w-2/3"]
const numberFormat = new Intl.NumberFormat("fr-FR")

// Post étalon sur une matière fixe (E1, étape 5 ; US3). Le texte n'est pas enregistré.
export function TestPostPanel({ lineId, lineName }: TestPostPanelProps) {
  const [pending, startTransition] = useTransition()
  const [testPost, setTestPost] = useState<TestPost | null>(null)

  function generate() {
    startTransition(async () => {
      try {
        const result = await generateTestPostAction(lineId)
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        setTestPost(result.data)
      } catch {
        toast.error("La génération a échoué. Vérifiez votre connexion puis réessayez.")
      }
    })
  }

  return (
    <Card className="ring-0">
      <CardHeader>
        <CardTitle>Post de test</CardTitle>
        <CardDescription>
          {`Matière fixe : ${TEST_MATERIAL.summary}. Régénérez autant que nécessaire avant d'activer la ligne.`}
        </CardDescription>
        <CardAction>
          <Button
            variant={testPost ? "secondary" : "default"}
            className="h-10 px-4"
            onClick={generate}
            disabled={pending}
          >
            {pending ? (
              <>
                <Spinner aria-hidden="true" />
                Rédaction en cours…
              </>
            ) : testPost ? (
              <>
                <RefreshCw aria-hidden="true" />
                Régénérer
              </>
            ) : (
              <>
                <Sparkles aria-hidden="true" />
                Générer le post de test
              </>
            )}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        <details className="text-sm text-muted-foreground">
          <summary className="w-fit cursor-pointer text-link">Voir la matière du post de test</summary>
          <dl className="mt-2 grid gap-2">
            {POST_TYPES[TEST_MATERIAL.type].questions.map((question) => (
              <div key={question.id} className="grid gap-0.5">
                <dt className="text-xs text-subtle-foreground">{question.label}</dt>
                <dd className="text-foreground">{TEST_MATERIAL.answers[question.id] ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </details>
        {pending ? (
          <div
            role="status"
            aria-busy="true"
            aria-label="Rédaction du post de test"
            className="grid max-w-[560px] gap-2.5 rounded-xl border p-4"
          >
            {SKELETON_WIDTHS.map((width, index) => (
              <Skeleton key={index} className={`h-4 ${width}`} />
            ))}
          </div>
        ) : testPost ? (
          <TestPostResult testPost={testPost} lineName={lineName} />
        ) : null}
      </CardContent>
    </Card>
  )
}

function TestPostResult({ testPost, lineName }: { testPost: TestPost; lineName: string }) {
  const blocking = testPost.report.issues.filter((issue) => issue.severity === "blocking")
  const warnings = testPost.report.issues.filter((issue) => issue.severity === "warning")

  return (
    <div className="grid gap-4">
      <div className="grid max-w-[560px] gap-2">
        <p className="text-xs text-subtle-foreground">
          {`Ligne ${lineName} · ${numberFormat.format(testPost.text.length)} caractères · texte non enregistré`}
        </p>
        <div className="rounded-xl border p-4 whitespace-pre-wrap">{testPost.text}</div>
      </div>
      <section aria-label="Contrôle de la charte" className="grid gap-2">
        {blocking.map((issue, index) => (
          <Alert key={`${index}-${issue.kind}`} variant="destructive" className="rounded-xl border-destructive">
            <TriangleAlert aria-hidden="true" />
            <AlertTitle>Bloquant</AlertTitle>
            <AlertDescription>{issue.message}</AlertDescription>
          </Alert>
        ))}
        {warnings.length > 0 && (
          <ul className="grid gap-1.5 text-sm">
            {warnings.map((issue, index) => (
              <li key={`${index}-${issue.kind}`} className="flex items-start gap-2">
                <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
                {issue.message}
              </li>
            ))}
          </ul>
        )}
        {testPost.report.issues.length === 0 && (
          <p className="flex items-center gap-2 text-sm">
            <Check aria-hidden="true" className="size-4 text-success" />
            Aucun écart avec la charte.
          </p>
        )}
      </section>
    </div>
  )
}
