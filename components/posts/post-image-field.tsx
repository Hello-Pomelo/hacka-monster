"use client"

import { ImagePlus, RefreshCw, Trash2, type LucideIcon } from "lucide-react"
import Image from "next/image"
import { useEffect, useId, useRef, useState, useTransition, type ChangeEvent } from "react"
import { toast } from "sonner"

import { removePostImage, savePostDraft, setPostImage } from "@/app/(app)/posts/actions"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { ActionResult, EditorPost } from "@/lib/creation"
import { MAX_POST_IMAGE_BYTES, POST_IMAGES_BUCKET, POST_IMAGE_TYPES, publicImageUrl } from "@/lib/posts"
import { createClient } from "@/lib/supabase/client"

type PostImageType = (typeof POST_IMAGE_TYPES)[number]

const EXTENSIONS: Record<PostImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
}
const UPLOAD_FAILED = "L'envoi de l'image a échoué. Réessayez."

function isPostImageType(type: string): type is PostImageType {
  return (POST_IMAGE_TYPES as readonly string[]).includes(type)
}

function ButtonIcon({ pending, icon: Icon }: { pending: boolean; icon: LucideIcon }) {
  return pending ? (
    <Spinner aria-hidden className="size-3.5" data-icon="inline-start" />
  ) : (
    <Icon aria-hidden data-icon="inline-start" />
  )
}

type PostImageFieldProps = {
  post: EditorPost
  readOnly: boolean
  onChange: (post: EditorPost) => void
}

// Image du post (spec Création de post, P0 9) : format et poids vérifiés à l'ajout, avant l'envoi
// direct du navigateur vers le bucket. Le texte alternatif est saisi par l'auteur.
export function PostImageField({ post, readOnly, onChange }: PostImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const postRef = useRef(post)
  const altId = useId()
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, startRemoving] = useTransition()
  const [isSavingAlt, startSavingAlt] = useTransition()
  // Saisie en cours, rattachée à son post : changer de post affiche le texte enregistré de l'autre.
  const [altDraft, setAltDraft] = useState<{ postId: string; value: string } | null>(null)

  useEffect(() => {
    postRef.current = post
  })

  const savedAlt = post.image_alt ?? ""
  const alt = altDraft?.postId === post.id ? altDraft.value : savedAlt
  const busy = isUploading || isRemoving

  // Le texte du post a pu changer pendant l'action : seuls les champs de l'image sont repris.
  function applyResult(result: ActionResult<EditorPost>): boolean {
    if (!result.ok) {
      toast.error(result.error)
      return false
    }
    const saved = result.data
    const latest = postRef.current
    onChange(
      latest.id === saved.id
        ? { ...latest, image_path: saved.image_path, image_alt: saved.image_alt, updated_at: saved.updated_at }
        : saved
    )
    return true
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!isPostImageType(file.type)) {
      toast.error("Format non accepté : JPG, PNG ou GIF.")
      return
    }
    if (file.size > MAX_POST_IMAGE_BYTES) {
      toast.error("Image trop lourde : 5 Mo au maximum.")
      return
    }

    const path = `${post.id}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`
    setIsUploading(true)
    try {
      const bucket = createClient().storage.from(POST_IMAGES_BUCKET)
      const { error } = await bucket.upload(path, file, { contentType: file.type, upsert: false })
      if (error) {
        toast.error(UPLOAD_FAILED)
        return
      }
      const result = await setPostImage({ postId: post.id, path, alt: alt.trim() })
      if (applyResult(result)) setAltDraft(null)
      // Fichier envoyé mais pas rattaché au post : retiré du bucket, sans conséquence en cas d'échec.
      else await bucket.remove([path]).catch(() => undefined)
    } catch {
      toast.error(UPLOAD_FAILED)
    } finally {
      setIsUploading(false)
    }
  }

  function handleRemove() {
    startRemoving(async () => {
      if (applyResult(await removePostImage(post.id))) setAltDraft(null)
    })
  }

  function handleAltBlur() {
    const value = alt.trim()
    if (value === savedAlt) return
    const postId = post.id
    startSavingAlt(async () => {
      applyResult(await savePostDraft({ postId, imageAlt: value }))
    })
  }

  if (readOnly && !post.image_path) return null

  const openPicker = () => inputRef.current?.click()

  return (
    <FieldSet className="min-w-0 gap-3">
      <FieldLegend variant="label" className="mb-0">
        Image
      </FieldLegend>

      {!readOnly && (
        <input
          ref={inputRef}
          type="file"
          accept={POST_IMAGE_TYPES.join(",")}
          className="hidden"
          tabIndex={-1}
          aria-hidden
          onChange={handleFile}
        />
      )}

      {post.image_path ? (
        <Image
          src={publicImageUrl(post.image_path)}
          alt={post.image_alt || "Image jointe au post"}
          width={1200}
          height={627}
          unoptimized
          className="h-auto max-h-48 w-auto max-w-full self-start rounded-lg border object-cover"
        />
      ) : (
        <>
          <FieldDescription>JPG, PNG ou GIF, 5 Mo au maximum.</FieldDescription>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="self-start"
            disabled={busy}
            onClick={openPicker}
          >
            <ButtonIcon pending={isUploading} icon={ImagePlus} />
            Ajouter une image
          </Button>
        </>
      )}

      {post.image_path && readOnly && (
        <p className="text-sm text-muted-foreground">Texte alternatif : {post.image_alt || "aucun"}</p>
      )}

      {post.image_path && !readOnly && (
        <>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={openPicker}>
              <ButtonIcon pending={isUploading} icon={RefreshCw} />
              Remplacer
            </Button>
            <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={handleRemove}>
              <ButtonIcon pending={isRemoving} icon={Trash2} />
              Retirer
            </Button>
          </div>
          <Field data-invalid={!alt.trim() || undefined}>
            <FieldLabel htmlFor={altId}>
              Texte alternatif
              {isSavingAlt && <Spinner className="size-3" aria-label="Enregistrement" />}
            </FieldLabel>
            <Input
              id={altId}
              required
              maxLength={300}
              value={alt}
              disabled={busy}
              aria-invalid={!alt.trim() || undefined}
              onChange={(event) => setAltDraft({ postId: post.id, value: event.target.value })}
              onBlur={handleAltBlur}
            />
            <FieldDescription>
              Décrit l&apos;image pour les personnes malvoyantes. Obligatoire pour programmer.
            </FieldDescription>
            {!alt.trim() && <FieldError>Ajoutez un texte alternatif.</FieldError>}
          </Field>
        </>
      )}
    </FieldSet>
  )
}
