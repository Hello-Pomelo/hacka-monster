"use client"

import { useRef } from "react"
import { RefreshCw, Sparkles, Square } from "lucide-react"
import { toast } from "sonner"

import { PostImageField } from "@/components/posts/post-image-field"
import { PostScheduleField } from "@/components/posts/post-schedule-field"
import { PostTextField } from "@/components/posts/post-text-field"
import { SaveIndicator } from "@/components/posts/save-indicator"
import type { AutosaveStatus } from "@/components/posts/use-autosave"
import type { GenerateMode, PostGeneration } from "@/components/posts/use-post-generation"
import type { SeriesGenerationState } from "@/components/posts/use-series-generation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { CREATION_TEXTS, canGenerate, isManualPost, type EditorPost } from "@/lib/creation"
import { isPostTypeId } from "@/lib/post-types"
import { RECOMMENDED_SLOTS } from "@/lib/recommended-slots"

const DEFAULT_TIME = "08:30"

type GenerationButtonsProps = {
  post: EditorPost
  text: string
  generation: PostGeneration
  queueRunning: boolean
  flush: () => Promise<boolean>
  onGenerated: (post: EditorPost) => void
}

// Générer un post vide, ou demander une nouvelle variante du texte actuel (E3).
function GenerationButtons({ post, text, generation, queueRunning, flush, onGenerated }: GenerationButtonsProps) {
  const stoppedRef = useRef(false)

  async function run(mode: GenerateMode) {
    stoppedRef.current = false
    // Le texte saisi part avant la génération, qui le remplace ensuite.
    if (!(await flush())) return
    const result = await generation.generate({
      postId: post.id,
      mode,
      currentText: mode === "variant" ? text : undefined,
    })
    if (result.ok) onGenerated(result.post)
    else if (stoppedRef.current) toast(result.error)
    else toast.error(result.error)
  }

  if (generation.activePostId === post.id) {
    return (
      <Button
        variant="secondary"
        className="h-10 w-fit px-4"
        onClick={() => {
          stoppedRef.current = true
          generation.stop()
        }}
      >
        <Square aria-hidden />
        Arrêter
      </Button>
    )
  }

  const disabled = generation.isGenerating || queueRunning
  return text.trim() ? (
    <Button variant="secondary" className="h-10 w-fit px-4" disabled={disabled} onClick={() => void run("variant")}>
      <RefreshCw aria-hidden />
      Nouvelle variante
    </Button>
  ) : (
    <Button className="h-10 w-fit px-4" disabled={disabled} onClick={() => void run("generate")}>
      <Sparkles aria-hidden />
      Générer le post
    </Button>
  )
}

// Texte reçu au fil de l'eau, ou squelette tant que rien n'est arrivé.
function WritingPreview({ text }: { text: string }) {
  return (
    <div aria-busy="true" className="grid gap-2">
      <p className="flex items-center gap-2 text-sm font-medium text-subtle-foreground">
        <Spinner aria-hidden className="size-4" />
        {CREATION_TEXTS.writing}
      </p>
      {text ? (
        <Textarea readOnly value={text} className="min-h-[320px] text-[15px] leading-relaxed md:text-[15px]" />
      ) : (
        <Skeleton className="h-[320px] w-full rounded-lg" />
      )}
    </div>
  )
}

type PostEditorCardProps = {
  post: EditorPost
  // Texte affiché : la saisie en cours, sinon le texte enregistré.
  text: string
  readOnly: boolean
  saveStatus: AutosaveStatus
  scheduleRevision: number
  generation: PostGeneration
  queue: SeriesGenerationState
  flush: () => Promise<boolean>
  onTextChange: (text: string) => void
  onScheduleChange: (iso: string | null) => void
  onPostChange: (post: EditorPost) => void
  onGenerated: (post: EditorPost) => void
}

// Éditeur du post courant (E3) : date, texte, génération et image.
export function PostEditorCard({
  post,
  text,
  readOnly,
  saveStatus,
  scheduleRevision,
  generation,
  queue,
  flush,
  onTextChange,
  onScheduleChange,
  onPostChange,
  onGenerated,
}: PostEditorCardProps) {
  const queueStatus = queue.statusById[post.id]
  const isActive = generation.activePostId === post.id
  const writing = isActive || queueStatus === "queued" || queueStatus === "writing"
  const manual = isManualPost(post)
  const showGeneration = !manual && !readOnly && canGenerate(post) && (isActive || !writing)
  const defaultTime = isPostTypeId(post.type) ? RECOMMENDED_SLOTS[post.type].time : DEFAULT_TIME

  return (
    <Card className="gap-5 p-6 ring-0">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg">Post</h2>
        <SaveIndicator status={saveStatus} />
      </div>

      <PostScheduleField
        key={post.id}
        value={post.scheduled_at}
        defaultTime={defaultTime}
        optional={manual && post.status !== "scheduled"}
        disabled={readOnly}
        revision={scheduleRevision}
        onChange={onScheduleChange}
      />

      {writing ? (
        <WritingPreview text={isActive ? generation.text : ""} />
      ) : (
        <PostTextField value={text} onChange={onTextChange} disabled={readOnly} />
      )}

      {showGeneration && (
        <GenerationButtons
          post={post}
          text={text}
          generation={generation}
          queueRunning={queue.isRunning}
          flush={flush}
          onGenerated={onGenerated}
        />
      )}

      <PostImageField post={post} readOnly={readOnly || writing} onChange={onPostChange} />
    </Card>
  )
}
