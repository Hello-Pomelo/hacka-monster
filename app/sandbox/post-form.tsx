"use client"

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { GenerateInput } from "@/lib/ai/schema"
import {
  LENGTH_IDS,
  LENGTH_LABELS,
  POST_TYPE_IDS,
  POST_TYPES,
  TONE_IDS,
  TONE_LABELS,
  type PostTypeId,
} from "@/lib/post-types"

type Params = GenerateInput["params"]

const TYPE_LABELS = Object.fromEntries(POST_TYPE_IDS.map((id) => [id, POST_TYPES[id].label]))

type PostFormProps = {
  type: PostTypeId
  answers: Record<string, string>
  params: Params
  onTypeChange: (type: PostTypeId) => void
  onAnswerChange: (questionId: string, answer: string) => void
  onParamsChange: (params: Params) => void
}

export function PostForm({
  type,
  answers,
  params,
  onTypeChange,
  onAnswerChange,
  onParamsChange,
}: PostFormProps) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Type de post</FieldLabel>
        <Select items={TYPE_LABELS} value={type} onValueChange={(value) => value && onTypeChange(value)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POST_TYPE_IDS.map((id) => (
              <SelectItem key={id} value={id}>
                {POST_TYPES[id].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {POST_TYPES[type].questions.map((question) => (
        <Field key={question.id}>
          <FieldLabel htmlFor={question.id}>{question.label}</FieldLabel>
          <Textarea
            id={question.id}
            placeholder={question.placeholder}
            value={answers[question.id] ?? ""}
            onChange={(event) => onAnswerChange(question.id, event.target.value)}
          />
        </Field>
      ))}

      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel>Ton</FieldLabel>
          <Select
            items={TONE_LABELS}
            value={params.tone}
            onValueChange={(tone) => tone && onParamsChange({ ...params, tone })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TONE_IDS.map((id) => (
                <SelectItem key={id} value={id}>
                  {TONE_LABELS[id]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Longueur</FieldLabel>
          <Select
            items={LENGTH_LABELS}
            value={params.length}
            onValueChange={(length) => length && onParamsChange({ ...params, length })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LENGTH_IDS.map((id) => (
                <SelectItem key={id} value={id}>
                  {LENGTH_LABELS[id]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="flex gap-6">
        <Field orientation="horizontal">
          <Switch
            id="emojis"
            checked={params.emojis}
            onCheckedChange={(emojis) => onParamsChange({ ...params, emojis })}
          />
          <FieldLabel htmlFor="emojis">Emojis</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Switch
            id="hashtags"
            checked={params.hashtags}
            onCheckedChange={(hashtags) => onParamsChange({ ...params, hashtags })}
          />
          <FieldLabel htmlFor="hashtags">Hashtags</FieldLabel>
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="cta">Appel à l&apos;action</FieldLabel>
        <Input
          id="cta"
          placeholder="Vide : l'IA choisit"
          value={params.cta}
          onChange={(event) => onParamsChange({ ...params, cta: event.target.value })}
        />
      </Field>
    </FieldGroup>
  )
}
