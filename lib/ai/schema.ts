import { z } from "zod"

import { LENGTH_IDS, POST_TYPE_IDS, TONE_IDS } from "@/lib/post-types"
import { Constants } from "@/lib/supabase/database.types"

// Corps de POST /api/generate. `currentText` présent : demande de variante.
export const generateInputSchema = z.object({
  type: z.enum(POST_TYPE_IDS),
  // Profil personnel (« je ») ou page entreprise (« nous »). Absent : la ligne éditoriale décide.
  cible: z.enum(Constants.public.Enums.post_target).optional(),
  answers: z.record(z.string(), z.string().trim().max(2000)),
  params: z.object({
    tone: z.enum(TONE_IDS),
    length: z.enum(LENGTH_IDS),
    emojis: z.boolean(),
    hashtags: z.boolean(),
    // Chaîne vide : l'IA choisit un appel à l'action adapté au type de post.
    cta: z.string().trim().max(200),
  }),
  currentText: z.string().trim().max(5000).optional(),
})

export type GenerateInput = z.infer<typeof generateInputSchema>
