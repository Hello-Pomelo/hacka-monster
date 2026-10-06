"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { signIn, signUp } from "../actions"

export function LoginForm() {
  const [signInState, signInAction, signingIn] = useActionState(signIn, {})
  const [signUpState, signUpAction, signingUp] = useActionState(signUp, {})
  const pending = signingIn || signingUp
  const error = signInState.error ?? signUpState.error

  return (
    <form>
      <Card>
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>Compte de test, données fictives uniquement.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                minLength={6}
                required
              />
            </Field>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {signUpState.info && <p className="text-sm text-muted-foreground">{signUpState.info}</p>}
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button type="submit" formAction={signInAction} disabled={pending}>
            {signingIn ? "Connexion…" : "Se connecter"}
          </Button>
          <Button type="submit" variant="outline" formAction={signUpAction} disabled={pending}>
            {signingUp ? "Création…" : "Créer un compte"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
