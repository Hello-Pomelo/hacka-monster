"use client"

import { useFormStatus } from "react-dom"
import { LoaderCircle, LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"

export function GoogleSignInButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? <LoaderCircle className="animate-spin" /> : <LogIn />}
      Se connecter avec Google
    </Button>
  )
}
