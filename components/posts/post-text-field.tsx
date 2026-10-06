import { Field, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { MAX_POST_LENGTH } from "@/lib/posts"
import { cn } from "@/lib/utils"

const numberFormat = new Intl.NumberFormat("fr-FR")

type PostTextFieldProps = {
  value: string
  onChange: (value: string) => void
  disabled: boolean
}

// Texte brut du post : retours à la ligne, emojis et hashtags conservés, saisie bloquée à 3 000.
export function PostTextField({ value, onChange, disabled }: PostTextFieldProps) {
  const atLimit = value.length >= MAX_POST_LENGTH

  return (
    <Field>
      <div className="flex items-baseline justify-between gap-3">
        <FieldLabel htmlFor="post-text">Texte du post</FieldLabel>
        <span
          id="post-text-count"
          className={cn(
            "text-xs text-subtle-foreground tabular-nums",
            atLimit && "font-medium text-destructive"
          )}
        >
          {numberFormat.format(value.length)} / {numberFormat.format(MAX_POST_LENGTH)}
        </span>
      </div>
      <Textarea
        id="post-text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={MAX_POST_LENGTH}
        disabled={disabled}
        aria-describedby="post-text-count"
        placeholder="Rédigez votre post : une accroche, des paragraphes courts, un appel à l'action."
        className="min-h-[320px] text-[15px] leading-relaxed md:text-[15px]"
      />
    </Field>
  )
}
