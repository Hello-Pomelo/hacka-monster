"use client"

import { useId } from "react"
import { ChevronDown } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Field, FieldLabel, FieldTitle } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { LENGTH_IDS, LENGTH_LABELS, TONE_IDS, TONE_LABELS, type PostParams } from "@/lib/post-types"

type SeriesSettingsSectionProps = {
  params: PostParams
  disabled: boolean
  onChange: (params: PostParams) => void
}

// Bloc replié « Réglages du post » de E2 : préremplis par la ligne éditoriale puis le gabarit,
// modifiables pour toute la série (spec Création de post, P0 2).
export function SeriesSettingsSection({ params, disabled, onChange }: SeriesSettingsSectionProps) {
  const id = useId()

  return (
    <Card className="p-5 ring-0">
      <Collapsible className="grid gap-4">
        <div className="grid gap-1">
          <h2 className="font-heading text-lg">
            <CollapsibleTrigger className="group/trigger flex w-full items-center justify-between gap-3 rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              Réglages du post
              <ChevronDown
                aria-hidden
                className="size-4 text-muted-foreground transition-transform group-data-[panel-open]/trigger:rotate-180"
              />
            </CollapsibleTrigger>
          </h2>
          <p className="text-[13px] text-subtle-foreground">
            Préremplis par la ligne éditoriale et le type de post.
          </p>
        </div>

        <CollapsibleContent className="grid gap-4">
          <div className="grid grid-cols-2 items-start gap-4">
            <Field>
              <FieldLabel htmlFor={`${id}-tone`}>Ton</FieldLabel>
              <Select
                items={TONE_LABELS}
                value={params.tone}
                onValueChange={(tone) => tone && onChange({ ...params, tone })}
                disabled={disabled}
              >
                <SelectTrigger id={`${id}-tone`} className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONE_IDS.map((tone) => (
                    <SelectItem key={tone} value={tone}>
                      {TONE_LABELS[tone]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldTitle id={`${id}-length`}>Longueur</FieldTitle>
              <ToggleGroup
                aria-labelledby={`${id}-length`}
                variant="outline"
                value={[params.length]}
                onValueChange={(value) => {
                  const length = LENGTH_IDS.find((lengthId) => lengthId === value[0])
                  if (length) onChange({ ...params, length })
                }}
                disabled={disabled}
              >
                {LENGTH_IDS.map((length) => (
                  <ToggleGroupItem
                    key={length}
                    value={length}
                    className="h-10 px-4 aria-pressed:border-primary aria-pressed:bg-tag aria-pressed:text-tag-foreground"
                  >
                    {LENGTH_LABELS[length]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          </div>

          <div className="flex gap-8">
            <Field orientation="horizontal" className="w-fit">
              <Switch
                id={`${id}-emojis`}
                checked={params.emojis}
                onCheckedChange={(emojis) => onChange({ ...params, emojis })}
                disabled={disabled}
              />
              <FieldLabel htmlFor={`${id}-emojis`}>Emojis</FieldLabel>
            </Field>
            <Field orientation="horizontal" className="w-fit">
              <Switch
                id={`${id}-hashtags`}
                checked={params.hashtags}
                onCheckedChange={(hashtags) => onChange({ ...params, hashtags })}
                disabled={disabled}
              />
              <FieldLabel htmlFor={`${id}-hashtags`}>Hashtags</FieldLabel>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor={`${id}-cta`}>Appel à l&apos;action</FieldLabel>
            <Input
              id={`${id}-cta`}
              maxLength={200}
              className="h-10"
              placeholder="Laissez vide : l'IA choisit selon le type de post"
              value={params.cta}
              onChange={(event) => onChange({ ...params, cta: event.target.value })}
              disabled={disabled}
            />
          </Field>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
