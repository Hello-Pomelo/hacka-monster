import { useId, useState } from "react"
import { ExternalLink, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { formatDate } from "@/lib/parametrage/format"
import { STARTER_STYLES } from "@/lib/parametrage/presets"
import { MAX_REFERENCE_POSTS, MIN_REFERENCE_POSTS, type ImportedPost } from "@/lib/parametrage/types"

import type { LineSectionProps } from "./line-editor"
import { StarterStylePicker } from "./starter-style-picker"

const EXCERPT_LENGTH = 220
// Longueur maximale d'un post de référence dans `lineFieldsSchema`.
const MAX_PASTED_LENGTH = 3000

function excerpt(text: string): string {
  const clean = text.trim()
  return clean.length > EXCERPT_LENGTH ? `${clean.slice(0, EXCERPT_LENGTH).trimEnd()}…` : clean
}

type ReferencePostsPickerProps = LineSectionProps & { importedPosts: ImportedPost[] }

// Posts de référence (E1, étape 2) : cochés parmi les posts importés, collés, ou tirés d'un style
// de départ. Les textes sont comparés sans les espaces de bord, que l'enregistrement retire.
export function ReferencePostsPicker({
  value,
  onChange,
  disabled,
  importedPosts,
}: ReferencePostsPickerProps) {
  const id = useId()
  const [draft, setDraft] = useState("")

  const references = value.reference_posts
  const count = references.length
  const full = count >= MAX_REFERENCE_POSTS
  const imported = importedPosts.filter((post) => post.content.trim())
  const importedTexts = new Set(imported.map((post) => post.content.trim()))
  const selected = new Set(references.map((text) => text.trim()))
  const pasted = references.filter((text) => !importedTexts.has(text.trim()))
  // Un style de départ fournit un seul exemple : il remplace les 3 posts demandés.
  const starter =
    count === 1 ? STARTER_STYLES.find((style) => style.examplePost === references[0]) : undefined

  function toggle(text: string, checked: boolean) {
    const key = text.trim()
    if (!checked) onChange({ reference_posts: references.filter((item) => item.trim() !== key) })
    else if (!full && !selected.has(key)) onChange({ reference_posts: [...references, key] })
  }

  function addPasted() {
    const text = draft.trim()
    if (!text || full) return
    if (!selected.has(text)) onChange({ reference_posts: [...references, text] })
    setDraft("")
  }

  return (
    <div className="grid gap-5">
      {(imported.length > 0 || count > 0) && (
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm" aria-live="polite">
          <span className="text-muted-foreground">
            Posts retenus :{" "}
            <span className="font-medium text-foreground tabular-nums">
              {count} sur {MAX_REFERENCE_POSTS}
            </span>
          </span>
          {count > 0 && count < MIN_REFERENCE_POSTS && !starter && (
            <span className="text-warning">Choisissez au moins {MIN_REFERENCE_POSTS} posts.</span>
          )}
        </div>
      )}

      {imported.length > 0 ? (
        <ul className="grid max-h-[420px] gap-2 overflow-y-auto pr-1" aria-label="Posts importés de la page">
          {imported.map((post) => {
            const checked = selected.has(post.content.trim())
            const checkboxId = `${id}-${post.id}`
            return (
              <li
                key={post.id}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 rounded-xl border border-input p-3 has-data-checked:border-primary has-data-checked:bg-tag"
              >
                <Checkbox
                  id={checkboxId}
                  checked={checked}
                  onCheckedChange={(next) => toggle(post.content, next)}
                  disabled={disabled || (!checked && full)}
                  className="mt-0.5"
                />
                <label htmlFor={checkboxId} className="line-clamp-3 cursor-pointer whitespace-pre-line">
                  {excerpt(post.content)}
                </label>
                <div className="col-start-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle-foreground">
                  {post.published_at && <span>{formatDate(post.published_at)}</span>}
                  {post.linkedin_url && (
                    <a
                      href={post.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-link underline-offset-4 hover:underline"
                    >
                      Voir sur LinkedIn
                      <ExternalLink aria-hidden="true" className="size-3" />
                    </a>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aucun post importé de la page LinkedIn : collez des posts déjà publiés.
        </p>
      )}

      <Field>
        <FieldLabel htmlFor={`${id}-paste`}>Coller un post</FieldLabel>
        <Textarea
          id={`${id}-paste`}
          rows={4}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Collez le texte d'un post publié sur LinkedIn."
          maxLength={MAX_PASTED_LENGTH}
          disabled={disabled || full}
          className="min-h-24"
        />
        {full && !disabled && (
          <FieldDescription>
            {MAX_REFERENCE_POSTS} posts au plus : retirez-en un pour en ajouter un autre.
          </FieldDescription>
        )}
        <div>
          <Button
            type="button"
            variant="secondary"
            className="h-10 px-4"
            onClick={addPasted}
            disabled={disabled || full || !draft.trim()}
          >
            <Plus aria-hidden="true" />
            Ajouter ce post
          </Button>
        </div>
      </Field>

      {pasted.length > 0 && (
        <ul className="grid gap-2" aria-label="Posts collés">
          {pasted.map((text, index) => (
            <li key={`${index}-${text.length}`} className="flex items-start gap-3 rounded-xl border border-input p-3">
              <div className="grid min-w-0 flex-1 gap-1">
                {starter && (
                  <span className="text-xs text-tag-foreground">Exemple du style {starter.label}</span>
                )}
                <p className="line-clamp-3 whitespace-pre-line">{excerpt(text)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onChange({ reference_posts: references.filter((item) => item !== text) })}
                disabled={disabled}
                aria-label="Retirer ce post"
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {imported.length === 0 && count === 0 && (
        <StarterStylePicker onChange={onChange} disabled={disabled} />
      )}
    </div>
  )
}
