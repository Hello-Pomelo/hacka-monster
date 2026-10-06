"use client"

import { useGeneratePost } from "@/components/posts/use-generate-post"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import type { GenerateInput } from "@/lib/ai/schema"

// Page de test de la génération (piste B). À supprimer avant la démo.

// Données fictives : elles partent vers un modèle gratuit.
const SAMPLE: GenerateInput = {
  type: "delivered_project",
  answers: {
    project: "refonte dashboard commercial pour un distributeur de materiel de jardin, ~40 commerciaux",
    problem:
      "avant ils avaient les chiffres le lundi pour la semaine d'avant, export excel a la main par le controle de gestion, plein d'erreurs",
    result: "chiffres dispo chaque matin a 7h, plus d'export manuel, le controle de gestion a recupere 1 jour/semaine",
    team: "Ines (data eng), Theo (BI), Sarah cheffe de projet. 8 semaines",
  },
  params: { tone: "friendly", length: "medium", emojis: true, hashtags: true, cta: "" },
}

export default function GenerateTestPage() {
  const { text, setText, isGenerating, generate, stop } = useGeneratePost()

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Test de la génération</h1>
        <p className="text-muted-foreground">
          Post fictif « Projet livré ». Nécessite d&apos;être connecté.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post généré</CardTitle>
          <CardDescription>
            Le texte reste modifiable. La variante part du texte modifié.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGenerating && !text ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Textarea
              className="min-h-64"
              value={text}
              readOnly={isGenerating}
              onChange={(event) => setText(event.target.value)}
            />
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button disabled={isGenerating} onClick={() => generate(SAMPLE)}>
            Générer
          </Button>
          <Button
            variant="secondary"
            disabled={isGenerating || !text}
            onClick={() => generate({ ...SAMPLE, currentText: text })}
          >
            Nouvelle variante
          </Button>
          {isGenerating && (
            <Button variant="outline" onClick={stop}>
              Arrêter
            </Button>
          )}
        </CardFooter>
      </Card>
    </main>
  )
}
