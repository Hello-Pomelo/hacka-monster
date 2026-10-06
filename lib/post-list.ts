// Filtres de la liste « Tous les posts » (E6) dans l'URL : `statut` et `ligne`.
// Utilisable côté serveur (page) et client (barre de filtres).

import { z } from "zod"

import type { PostListFilters } from "@/lib/creation-data"
import type { PostStatus } from "@/lib/posts"

export const LIST_STATUS_IDS = [
  "draft",
  "scheduled",
  "publishing",
  "published",
  "failed",
  "archived",
] as const satisfies readonly PostStatus[]

export const LIST_LINE_IDS = ["toutes", "marketing", "rh"] as const

export type ListLine = (typeof LIST_LINE_IDS)[number]

export const LIST_LINE_LABELS: Record<ListLine, string> = {
  toutes: "Toutes",
  marketing: "Marketing",
  rh: "RH",
}

// Valeur absente ou invalide : tous les statuts hors Archivé, toutes les lignes.
export const listStatusSchema = z.enum(LIST_STATUS_IDS).nullable().catch(null)
export const listLineSchema = z.enum(LIST_LINE_IDS).catch("toutes")

function firstValue(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value
}

export function parsePostListSearch(search: { statut?: unknown; ligne?: unknown }): PostListFilters {
  return {
    status: listStatusSchema.parse(firstValue(search.statut)),
    line: listLineSchema.parse(firstValue(search.ligne)),
  }
}

export function hasListFilters(filters: PostListFilters): boolean {
  return filters.status !== null || filters.line !== "toutes"
}

// URL de la liste ; les valeurs par défaut sont omises.
export function postsHref(filters: PostListFilters): string {
  const params = new URLSearchParams()
  if (filters.status) params.set("statut", filters.status)
  if (filters.line !== "toutes") params.set("ligne", filters.line)
  const query = params.toString()
  return query ? `/posts?${query}` : "/posts"
}
