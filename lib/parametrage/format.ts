// Formats de date et de compteur du paramétrage, en français, fuseau Europe/Paris.

const dateTimeFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Europe/Paris",
})

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Paris",
})

const shortDateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Paris",
})

// « 6 octobre 2026 à 8 h 30 »
export function formatDateTime(iso: string): string {
  const parts = Object.fromEntries(
    dateTimeFormat.formatToParts(new Date(iso)).map((part) => [part.type, part.value])
  )
  return `${parts.day} ${parts.month} ${parts.year} à ${parts.hour} h ${parts.minute}`
}

// « 6 octobre 2026 »
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso))
}

// « 06/10 »
export function formatShortDate(iso: string): string {
  return shortDateFormat.format(new Date(iso))
}

export function formatImportCount(n: number): string {
  if (n === 0) return "Aucun nouveau post importé"
  return n === 1 ? "1 post importé" : `${n} posts importés`
}
