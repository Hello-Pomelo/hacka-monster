import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

// Point d'entrée de la synchro LinkedIn : enregistre les totaux du jour de chaque post.
// À appeler côté serveur uniquement, avec la session d'un admin. Le RLS refuse un post
// non publié et un jour de relevé dans le futur ou antérieur à la publication.
// Correspondance avec l'API LinkedIn : voir le README et les commentaires de la table post_metrics.

function todayInParis(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date())
}

export const postMetricsSnapshotSchema = z.object({
  postId: z.uuid(),
  // Jour du relevé (AAAA-MM-JJ), par défaut aujourd'hui à Paris. Jamais dans le futur.
  capturedOn: z.iso
    .date()
    .refine((day) => day <= todayInParis(), "Jour de relevé dans le futur")
    .optional(),
  impressions: z.number().int().min(0),
  membersReached: z.number().int().min(0).nullable().optional(),
  // Pas de minimum : LinkedIn documente un likeCount qui peut devenir négatif.
  reactions: z.number().int(),
  comments: z.number().int().min(0),
  reposts: z.number().int().min(0),
  // Null pour un compte perso : LinkedIn ne fournit pas de clics équivalents.
  clicks: z.number().int().min(0).nullable().optional(),
})

export type PostMetricsSnapshot = z.input<typeof postMetricsSnapshotSchema>

export type SavePostMetricsResult = { ok: true; saved: number } | { ok: false; error: string }

export async function savePostMetrics(
  snapshots: PostMetricsSnapshot[]
): Promise<SavePostMetricsResult> {
  const input = z.array(postMetricsSnapshotSchema).max(500).safeParse(snapshots)
  if (!input.success) return { ok: false, error: "Relevés invalides." }

  // Un seul relevé par post et par jour dans un même envoi : le dernier l'emporte.
  const today = todayInParis()
  const rows = new Map(
    input.data.map((snapshot) => {
      const capturedOn = snapshot.capturedOn ?? today
      return [
        `${snapshot.postId}:${capturedOn}`,
        {
          post_id: snapshot.postId,
          captured_on: capturedOn,
          impressions: snapshot.impressions,
          members_reached: snapshot.membersReached ?? null,
          reactions: snapshot.reactions,
          comments: snapshot.comments,
          reposts: snapshot.reposts,
          clicks: snapshot.clicks ?? null,
        },
      ]
    })
  )
  if (rows.size === 0) return { ok: true, saved: 0 }

  const supabase = await createClient()
  const { error } = await supabase
    .from("post_metrics")
    .upsert([...rows.values()], { onConflict: "post_id,captured_on" })

  if (error) return { ok: false, error: "L'enregistrement des statistiques a échoué." }

  revalidatePath("/stats")
  return { ok: true, saved: rows.size }
}
