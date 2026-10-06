import { CheckCircle2Icon, XCircleIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/server"

import { ToastButton } from "./toast-button"

// Page de diagnostic du socle (env, Supabase, shadcn/ui). À supprimer avant la démo.

const ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "OPENROUTER_API_KEY",
  "OPENROUTER_MODEL",
] as const

function Status({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="font-mono text-sm">{label}</span>
      {ok ? (
        <Badge variant="secondary">
          <CheckCircle2Icon /> OK
        </Badge>
      ) : (
        <Badge variant="destructive">
          <XCircleIcon /> Manquant
        </Badge>
      )}
    </div>
  )
}

export default async function TestPage() {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims.sub
  const email = claims?.claims.email

  // Sans session, le RLS renvoie une liste vide sans erreur : la connexion est quand même validée.
  const { data: editorialLine, error: dbError } = await supabase
    .from("editorial_line")
    .select("ton")
    .maybeSingle()

  const { data: profile } = userId
    ? await supabase.from("profiles").select("nom, role").eq("id", userId).maybeSingle()
    : { data: null }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Page de test du socle</h1>
        <p className="text-muted-foreground">
          Vérifie la configuration avant de démarrer les features.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Variables d&apos;environnement</CardTitle>
          <CardDescription>Présence uniquement, les valeurs ne sont jamais affichées.</CardDescription>
        </CardHeader>
        <CardContent>
          {ENV_VARS.map((name) => (
            <Status key={name} label={name} ok={Boolean(process.env[name])} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supabase</CardTitle>
          <CardDescription>Connexion à la base, session et RLS.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <Status label="Connexion à la base" ok={!dbError} />
          {dbError && <p className="text-destructive">{dbError.message}</p>}
          <Status label="Session utilisateur" ok={Boolean(userId)} />
          {userId ? (
            <p>
              Connecté en tant que <strong>{email}</strong>
              {profile && (
                <>
                  {" "}
                  ({profile.nom}, rôle <Badge variant="outline">{profile.role}</Badge>)
                </>
              )}
            </p>
          ) : (
            <p className="text-muted-foreground">
              Non connecté : normal tant que la page /login n&apos;existe pas.
            </p>
          )}
          <p className="text-muted-foreground">
            Ligne éditoriale lisible :{" "}
            {editorialLine
              ? "oui (utilisateur connecté)"
              : "non (attendu sans session, le RLS la réserve aux connectés)"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Composants shadcn/ui</CardTitle>
          <CardDescription>Thème, police et toasts.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button>Principal</Button>
            <Button variant="secondary">Secondaire</Button>
            <Button variant="outline">Contour</Button>
            <Button variant="destructive">Danger</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">brouillon</Badge>
            <Badge variant="secondary">en_relecture</Badge>
            <Badge>valide</Badge>
            <Badge variant="destructive">publie</Badge>
          </div>
          <Input placeholder="Champ de saisie" />
          <ToastButton />
        </CardContent>
      </Card>
    </main>
  )
}
