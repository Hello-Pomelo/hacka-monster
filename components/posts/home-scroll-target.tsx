"use client"

import { useEffect, useRef, type ReactNode } from "react"

type HomeScrollTargetProps = {
  // Change à chaque jour sélectionné ou à l'ouverture de l'onglet Idées ; null : aucun défilement.
  scrollKey: string | null
  children: ReactNode
}

// Bloc sous le calendrier : la page défile juste assez pour le montrer (spec Mon calendrier 3.4).
export function HomeScrollTarget({ scrollKey, children }: HomeScrollTargetProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollKey === null) return
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ref.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" })
  }, [scrollKey])

  return (
    <div ref={ref} className="min-w-0 scroll-mt-6">
      {children}
    </div>
  )
}
