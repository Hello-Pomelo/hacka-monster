import Image from "next/image"
import { redirect } from "next/navigation"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getCurrentProfile, nextPathSchema } from "@/lib/supabase/auth"

import { signInWithGoogle } from "./actions"
import { GoogleSignInButton } from "./google-sign-in-button"

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams
  const nextPath = nextPathSchema.parse(next)

  if (await getCurrentProfile()) redirect(nextPath)

  return (
    <main className="flex flex-1 items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center gap-3">
          <Image
            src="/logo-community-monster.png"
            alt=""
            width={440}
            height={147}
            priority
            className="mx-auto h-auto w-56"
          />
          <CardTitle className="sr-only">Community Monster</CardTitle>
          <CardDescription>
            Connectez-vous avec votre compte Google Hello Pomelo. L&apos;accès à
            votre agenda servira à y placer les dates de diffusion de vos posts.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {error !== undefined && (
            <p role="alert" className="text-sm text-destructive">
              La connexion a échoué. Réessayez avec votre compte Hello Pomelo.
            </p>
          )}
          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value={nextPath} />
            <GoogleSignInButton />
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
