"use client"

import { useState, type ReactNode } from "react"

import { saveLine } from "@/app/(app)/parametrage/actions"
import { SaveIndicator } from "@/components/parametrage/save-indicator"
import { useAutosave } from "@/components/parametrage/use-autosave"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  MAX_REFERENCE_POSTS,
  MIN_REFERENCE_POSTS,
  toLineFields,
  type EditorialLine,
  type ImportedPost,
  type LineFields,
} from "@/lib/parametrage/types"
import { cn } from "@/lib/utils"

import { AiProposalButton } from "./ai-proposal-button"
import { DefaultsFields } from "./defaults-fields"
import { IdentityFields } from "./identity-fields"
import { ReferencePostsPicker } from "./reference-posts-picker"
import { VoiceFields } from "./voice-fields"

export type LineEditorSection = "identity" | "examples" | "voice" | "defaults"

// Props communes aux sections de l'éditeur : la ligne entière en lecture, un correctif en écriture.
export type LineSectionProps = {
  value: LineFields
  onChange: (patch: Partial<LineFields>) => void
  disabled: boolean
}

type LineEditorProps = {
  line: EditorialLine
  importedPosts: ImportedPost[]
  sections: LineEditorSection[]
  readOnly?: boolean
}

// Éditeur d'une ligne éditoriale (spec Paramétrage, E1 étapes 1 à 3, E2 onglet Lignes), enregistré
// automatiquement. La clé ne dépend que de la ligne et du mode : un rafraîchissement après
// enregistrement garde l'état local, un changement de ligne ou de droits repart du serveur.
export function LineEditor(props: LineEditorProps) {
  return <LineEditorForm key={`${props.line.id}:${props.readOnly ? "read" : "edit"}`} {...props} />
}

function LineEditorForm({ line, importedPosts, sections, readOnly = false }: LineEditorProps) {
  const [fields, setFields] = useState<LineFields>(() => toLineFields(line))
  const { state, flush } = useAutosave(fields, (next) => saveLine(line.id, next), {
    enabled: !readOnly,
  })
  // En lecture seule, l'affichage suit la ligne du serveur à chaque rafraîchissement.
  const value = readOnly ? toLineFields(line) : fields

  function update(patch: Partial<LineFields>) {
    setFields((current) => ({ ...current, ...patch }))
  }

  const importedCount = importedPosts.filter((post) => post.content.trim()).length
  const referenceCount = value.reference_posts.length
  const hasVoice = [value.voice_adjectives, value.we_are, value.we_are_not, value.pillars].some(
    (list) => list.length > 0
  )

  function renderSection(section: LineEditorSection) {
    switch (section) {
      case "identity":
        return (
          <EditorCard
            key={section}
            title="Identité et valeurs"
            description="Qui vous êtes : l'IA s'en sert dans chaque post de cette ligne."
          >
            <IdentityFields value={value} onChange={update} disabled={readOnly} />
          </EditorCard>
        )
      case "examples":
        return (
          <EditorCard
            key={section}
            title="Posts de référence"
            description={`Cochez ${MIN_REFERENCE_POSTS} à ${MAX_REFERENCE_POSTS} posts qui sonnent comme vous voulez sonner.`}
          >
            <ReferencePostsPicker
              value={value}
              onChange={update}
              disabled={readOnly}
              importedPosts={importedPosts}
            />
          </EditorCard>
        )
      case "voice":
        return (
          <EditorCard
            key={section}
            title="Voix et piliers"
            description="Proposés par l'IA à partir de vos posts, modifiables champ par champ."
          >
            {!readOnly && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-tag-border bg-tag p-3">
                <AiProposalButton
                  lineId={line.id}
                  hasProposal={hasVoice}
                  beforePropose={flush}
                  onProposal={update}
                  disabled={importedCount === 0 && referenceCount === 0}
                />
                <p className="text-sm text-muted-foreground">
                  {proposalSourceHint(importedCount, referenceCount)}
                </p>
              </div>
            )}
            <VoiceFields value={value} onChange={update} disabled={readOnly} />
          </EditorCard>
        )
      case "defaults":
        return (
          <EditorCard
            key={section}
            title="Réglages par défaut d'un post"
            description="Appliqués quand ni la série ni le gabarit n'en fixent d'autres."
          >
            <DefaultsFields value={value} onChange={update} disabled={readOnly} />
          </EditorCard>
        )
    }
  }

  return (
    <div className="grid gap-3">
      {!readOnly && (
        // Reste visible pendant la saisie des dernières sections, sans capter les clics dessous.
        <div className="pointer-events-none sticky top-4 z-10 flex justify-end">
          <div
            className={cn(
              "rounded-lg px-2.5 py-1.5",
              state !== "idle" && "bg-card shadow-float"
            )}
          >
            <SaveIndicator state={state} />
          </div>
        </div>
      )}
      <div className="grid gap-6">{sections.map(renderSection)}</div>
    </div>
  )
}

// Source de la proposition, identique à celle de proposeLineAction : posts importés, sinon posts de référence.
function proposalSourceHint(importedCount: number, referenceCount: number): string {
  if (importedCount > 0) {
    return importedCount === 1
      ? "L'IA s'appuie sur le post importé de la page."
      : `L'IA s'appuie sur les ${importedCount} posts importés de la page.`
  }
  if (referenceCount > 0) {
    return referenceCount === 1
      ? "L'IA s'appuie sur votre post de référence."
      : `L'IA s'appuie sur vos ${referenceCount} posts de référence.`
  }
  return "Ajoutez au moins un post de référence pour obtenir une proposition."
}

function EditorCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Card className="ring-0">
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">{children}</CardContent>
    </Card>
  )
}
