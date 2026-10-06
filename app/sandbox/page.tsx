import { redirect } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentProfile } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

import { Workbench } from "./workbench"

export default async function SandboxPage() {
  if (!(await getCurrentProfile())) redirect("/sandbox/login")

  const supabase = await createClient()
  const { data: line } = await supabase
    .from("editorial_line")
    .select("ton, valeurs, mots_a_eviter, exemples")
    .maybeSingle()

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <Workbench />

      <Card>
        <CardHeader>
          <CardTitle>Ligne éditoriale</CardTitle>
          <CardDescription>Lue en base, injectée dans chaque génération.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {line ? (
            <>
              <p><strong>Ton :</strong> {line.ton}</p>
              <p><strong>Valeurs :</strong> {line.valeurs}</p>
              <p><strong>À éviter :</strong> {line.mots_a_eviter}</p>
              <p className="whitespace-pre-wrap text-muted-foreground">{line.exemples}</p>
            </>
          ) : (
            <p className="text-destructive">Ligne éditoriale introuvable : la génération échouera.</p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
