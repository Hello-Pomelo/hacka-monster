"use client"

// Client : `Badge` (Base UI) appelle des hooks client, interdits dans un Server Component.

import { Ban, Check, EyeOff, type LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { CLIENT_STATUS_LABELS, type ClientStatus } from "@/lib/parametrage/types"
import { cn } from "@/lib/utils"

const STYLES: Record<
  ClientStatus,
  { variant: "outline" | "secondary"; className: string; icon: LucideIcon }
> = {
  citable: { variant: "secondary", className: "bg-success-surface text-success", icon: Check },
  citable_without_detail: {
    variant: "secondary",
    className: "bg-warning-surface text-warning",
    icon: EyeOff,
  },
  not_citable: { variant: "outline", className: "border-destructive text-destructive", icon: Ban },
}

export function ClientStatusBadge({ status, className }: { status: ClientStatus; className?: string }) {
  const { variant, className: style, icon: Icon } = STYLES[status]

  return (
    <Badge
      variant={variant}
      className={cn("h-[22px] text-[11px] tracking-[0.05em] uppercase", style, className)}
    >
      <Icon aria-hidden />
      {CLIENT_STATUS_LABELS[status]}
    </Badge>
  )
}
