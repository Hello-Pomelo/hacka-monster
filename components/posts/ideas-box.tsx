"use client"

import { CalendarPlus, Lightbulb, Plus, Trash2 } from "lucide-react"
import { useState, useTransition, type FormEvent } from "react"
import { toast } from "sonner"

import { addIdea, deleteIdea } from "@/app/(app)/ideas/actions"
import { NewPostButton } from "@/components/posts/new-post-button"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { formatDayShort, parisDay } from "@/lib/suggestions"

export type Idea = { id: string; text: string; created_at: string; author: string }

function IdeaRow({ idea }: { idea: Idea }) {
  const [pending, startTransition] = useTransition()

  function remove() {
    startTransition(async () => {
      const result = await deleteIdea(idea.id)
      if (!result.ok) toast.error(result.error)
      else toast.success("Idée supprimée.")
    })
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-b-0">
      <div className="grid min-w-0 flex-1 gap-1">
        <p className="leading-[1.3] font-medium">{idea.text}</p>
        <span className="text-xs text-subtle-foreground">
          {idea.author}, le {formatDayShort(parisDay(idea.created_at))}
        </span>
      </div>
      <div className="flex gap-2">
        <NewPostButton size="sm" variant="secondary" prefill={{ subject: idea.text, ideaId: idea.id }}>
          <CalendarPlus aria-hidden />
          Planifier
        </NewPostButton>
        <Button variant="ghost" size="sm" onClick={remove} disabled={pending}>
          <Trash2 aria-hidden />
          Supprimer
        </Button>
      </div>
    </li>
  )
}

// Boîte à idées partagée entre tous les admins (D28).
export function IdeasBox({ ideas }: { ideas: Idea[] }) {
  const [text, setText] = useState("")
  const [pending, startTransition] = useTransition()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = text.trim()
    if (!value) return
    startTransition(async () => {
      const result = await addIdea(value)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setText("")
    })
  }

  return (
    <div className="grid gap-3">
      <form onSubmit={submit} className="flex gap-2">
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Notez une idée en une phrase"
          aria-label="Nouvelle idée"
          maxLength={500}
          disabled={pending}
          className="bg-card"
        />
        <Button type="submit" disabled={pending || !text.trim()}>
          <Plus aria-hidden />
          Ajouter
        </Button>
      </form>

      {ideas.length > 0 ? (
        <ul className="rounded-xl bg-card px-4">
          {ideas.map((idea) => (
            <IdeaRow key={idea.id} idea={idea} />
          ))}
        </ul>
      ) : (
        <Empty className="rounded-xl bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Lightbulb aria-hidden />
            </EmptyMedia>
            <EmptyTitle>Aucune idée pour l&apos;instant</EmptyTitle>
            <EmptyDescription>Les idées notées par l&apos;équipe s&apos;affichent ici.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
