import { redirect } from "next/navigation"

import { getCurrentProfile } from "@/lib/supabase/auth"

import { LoginForm } from "./login-form"

export default async function SandboxLoginPage() {
  if (await getCurrentProfile()) redirect("/sandbox")

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <LoginForm />
    </main>
  )
}
