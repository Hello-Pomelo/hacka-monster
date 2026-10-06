"use client"

import { useEffect, useEffectEvent, useRef, type ReactNode } from "react"

export const HOME_PANEL_ID = "home-panel"

// La page défile juste assez pour montrer le bloc sous le calendrier (spec Mon calendrier 3.4).
export function revealHomePanel(element: HTMLElement | null) {
  if (!element) return
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  element.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" })
}

type HomeScrollTargetProps = {
  // Jour sélectionné : la page défile à chaque nouveau jour.
  day: string | null
  // Onglet Idées demandé par l'URL : la page défile à l'arrivée sur l'accueil, pas à un changement
  // d'onglet. Depuis l'accueil, le lien « Boîte à idées » fait défiler lui-même (app-sidebar-nav).
  revealOnArrival: boolean
  children: ReactNode
}

export function HomeScrollTarget({ day, revealOnArrival, children }: HomeScrollTargetProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (day !== null) revealHomePanel(ref.current)
  }, [day])

  const onArrival = useEffectEvent(() => {
    if (day === null && revealOnArrival) revealHomePanel(ref.current)
  })
  useEffect(() => {
    onArrival()
  }, [])

  return (
    <div ref={ref} id={HOME_PANEL_ID} className="min-w-0 scroll-mt-6">
      {children}
    </div>
  )
}
