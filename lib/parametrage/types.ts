// Contrat du paramétrage rédaction (spec Paramétrage) : types, libellés, schémas de saisie et liens.
// Utilisable côté serveur et client.

import { z } from "zod"

import { DEFAULT_PARAMS, parsePostParams, postParamsSchema, type Post } from "@/lib/posts"
import { Constants, type Enums, type Tables } from "@/lib/supabase/database.types"

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string }

export type EditorialLine = Tables<"editorial_lines">
export type Charter = Tables<"charter">
export type CharterClient = Tables<"charter_clients">
export type ClientStatus = Enums<"client_status">

// Lignes qu'un admin peut prendre en charge (D4). La ligne Neutre n'est jamais modifiable.
export const EDITABLE_LINE_CODES = ["marketing", "rh"] as const
export type EditableLineCode = (typeof EDITABLE_LINE_CODES)[number]

export function isEditableLineCode(value: unknown): value is EditableLineCode {
  return typeof value === "string" && (EDITABLE_LINE_CODES as readonly string[]).includes(value)
}

export type ImportedPost = Pick<Post, "id" | "content" | "published_at" | "linkedin_url">

export type AdminRow = {
  id: string
  nom: string
  role: Enums<"user_role">
  lineId: string | null
  lineName: string | null
}

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  citable: "Citable",
  citable_without_detail: "Citable sans détail",
  not_citable: "Non citable",
}

export const ADDRESS_FORM_LABELS = { vous: "Vouvoiement", tu: "Tutoiement" } as const

export const MIN_REFERENCE_POSTS = 3
export const MAX_REFERENCE_POSTS = 5
export const MAX_CORE_VALUES = 3
export const MAX_VOICE_ADJECTIVES = 3

// Objectif de rythme d'une ligne, en posts par semaine (D22).
export const TARGET_FREQUENCY_OPTIONS = [
  { value: 0.25, label: "1 post par mois" },
  { value: 0.5, label: "1 post toutes les 2 semaines" },
  { value: 1, label: "1 post par semaine" },
  { value: 2, label: "2 posts par semaine" },
  { value: 3, label: "3 posts par semaine" },
] as const
export const DEFAULT_TARGET_PER_WEEK = 1

const listItem = (max: number) => z.string().trim().min(1).max(max)

// Champs modifiables d'une ligne éditoriale (table `editorial_lines`).
export const lineFieldsSchema = z.object({
  brand: z.string().trim().max(120),
  about: z.string().trim().max(1500),
  core_values: z.array(listItem(60)).max(MAX_CORE_VALUES),
  targets: z.string().trim().max(500),
  voice_adjectives: z.array(listItem(40)).max(MAX_VOICE_ADJECTIVES),
  we_are: z.array(listItem(120)).max(6),
  we_are_not: z.array(listItem(120)).max(6),
  pillars: z.array(listItem(80)).max(6),
  target_per_week: z.number().min(0.25).max(14),
  defaults: postParamsSchema,
  reference_posts: z.array(listItem(3000)).max(MAX_REFERENCE_POSTS),
})
export type LineFields = z.infer<typeof lineFieldsSchema>

export function toLineFields(line: EditorialLine): LineFields {
  return {
    brand: line.brand,
    about: line.about,
    core_values: line.core_values,
    targets: line.targets,
    voice_adjectives: line.voice_adjectives,
    we_are: line.we_are,
    we_are_not: line.we_are_not,
    pillars: line.pillars,
    target_per_week: Number(line.target_per_week),
    defaults: parsePostParams(line.defaults, DEFAULT_PARAMS),
    reference_posts: line.reference_posts,
  }
}

// Champs proposés par l'IA à partir des posts (E1, étape 3).
export const lineProposalSchema = lineFieldsSchema.pick({
  voice_adjectives: true,
  we_are: true,
  we_are_not: true,
  pillars: true,
  target_per_week: true,
  defaults: true,
})
export type LineProposal = z.infer<typeof lineProposalSchema>

export const charterFieldsSchema = z.object({
  banned_expressions: z.array(listItem(120)).max(100),
  sensitive_topics: z.array(listItem(120)).max(50),
  address_form: z.enum(["tu", "vous"]),
  inclusive_writing: z.boolean(),
})
export type CharterFields = z.infer<typeof charterFieldsSchema>

export const clientInputSchema = z.object({
  name: z.string().trim().min(1, "Saisissez le nom du client.").max(120),
  aliases: z.array(listItem(120)).max(20),
  status: z.enum(Constants.public.Enums.client_status),
})
export type ClientInput = z.infer<typeof clientInputSchema>

// Miroir de la règle du bandeau « Ligne éditoriale non configurée » (piste Calendrier).
export function isLineConfigured(line: Pick<EditorialLine, "code" | "configured"> | null): boolean {
  return line !== null && line.code !== "neutre" && line.configured
}

// Onglets de /parametrage, choisis par le paramètre d'URL `onglet`.
export const PARAMETRAGE_TABS = ["connexion", "charte", "lignes", "gabarits", "admins", "versions"] as const
export type ParametrageTab = (typeof PARAMETRAGE_TABS)[number]

export const PARAMETRAGE_TAB_LABELS: Record<ParametrageTab, string> = {
  connexion: "Connexion LinkedIn",
  charte: "Charte",
  lignes: "Lignes",
  gabarits: "Gabarits",
  admins: "Admins",
  versions: "Versions",
}

// `linkedin` : alias utilisé par le lien d'état de la connexion dans la navigation.
export function parseParametrageTab(value: unknown): ParametrageTab {
  if (value === "linkedin") return "connexion"
  if (typeof value === "string" && (PARAMETRAGE_TABS as readonly string[]).includes(value)) {
    return value as ParametrageTab
  }
  return "connexion"
}

export function parametrageHref(tab: ParametrageTab, extra?: Record<string, string>): string {
  return `/parametrage?${new URLSearchParams({ onglet: tab, ...extra })}`
}

// Étapes de l'onboarding au hackathon (spec Paramétrage, section 6), choisies par `etape`.
export const ONBOARDING_STEPS = ["connexion", "identite", "charte", "test"] as const
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]

export const ONBOARDING_STEP_LABELS: Record<OnboardingStep, string> = {
  connexion: "Connexion LinkedIn",
  identite: "Identité et exemples",
  charte: "Charte",
  test: "Test",
}

export function parseOnboardingStep(value: unknown): OnboardingStep {
  if (typeof value === "string" && (ONBOARDING_STEPS as readonly string[]).includes(value)) {
    return value as OnboardingStep
  }
  return "connexion"
}

export function onboardingHref(step: OnboardingStep): string {
  return `/onboarding?etape=${step}`
}
