"use client"

import { useState } from "react"

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
import type { PostTypeId } from "@/lib/post-types"

import { PostForm } from "./post-form"
import { SAMPLE_ANSWERS } from "./samples"

const DEFAULT_PARAMS: GenerateInput["params"] = {
  tone: "friendly",
  length: "medium",
  emojis: true,
  hashtags: true,
  cta: "",
}

export function Workbench() {
  const [type, setType] = useState<PostTypeId>("project_delivered")
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const { text, setText, isGenerating, generate, stop } = useGeneratePost()

  const input: GenerateInput = { type, answers, params }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Paramétrage</CardTitle>
          <CardDescription>Réponses en vrac acceptées.</CardDescription>
        </CardHeader>
        <CardContent>
          <PostForm
            type={type}
            answers={answers}
            params={params}
            onTypeChange={setType}
            onAnswerChange={(id, answer) => setAnswers({ ...answers, [id]: answer })}
            onParamsChange={setParams}
          />
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button disabled={isGenerating} onClick={() => generate(input)}>
            Générer
          </Button>
          <Button
            variant="outline"
            disabled={isGenerating}
            onClick={() => setAnswers({ ...answers, ...SAMPLE_ANSWERS[type] })}
          >
            Remplir un exemple
          </Button>
        </CardFooter>
      </Card>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Post</CardTitle>
            <CardDescription>Modifiable. La variante part du texte modifié.</CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating && !text ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <Textarea
                className="min-h-72"
                value={text}
                readOnly={isGenerating}
                placeholder="Le post généré apparaît ici."
                onChange={(event) => setText(event.target.value)}
              />
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              variant="secondary"
              disabled={isGenerating || !text}
              onClick={() => generate({ ...input, currentText: text })}
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

        {text && (
          <Card>
            <CardHeader>
              <CardTitle>Aperçu brut</CardTitle>
              <CardDescription>{text.length} caractères</CardDescription>
            </CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">{text}</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
