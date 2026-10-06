"use client"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"

export function ToastButton() {
  return (
    <Button variant="outline" onClick={() => toast.success("Les toasts fonctionnent")}>
      Tester un toast
    </Button>
  )
}
