// Formats français de l'écran Statistiques. Fuseau fixé pour que serveur et
// navigateur affichent la même date.

const TIME_ZONE = "Europe/Paris"

const integerFormat = new Intl.NumberFormat("fr-FR")
const compactFormat = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 })
const percentFormat = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
const signedPercentFormat = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 0,
  signDisplay: "exceptZero",
})
const signedPointsFormat = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
})
const signedIntegerFormat = new Intl.NumberFormat("fr-FR", { signDisplay: "exceptZero" })
const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
})
const shortDateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: TIME_ZONE,
})

export const formatNumber = (value: number) => integerFormat.format(value)
export const formatCompact = (value: number) => compactFormat.format(value)
export const formatPercent = (ratio: number) => percentFormat.format(ratio)
export const formatSignedPercent = (ratio: number) => signedPercentFormat.format(ratio)
export const formatSignedPoints = (ratio: number) => `${signedPointsFormat.format(ratio * 100)} pt`
export const formatSignedNumber = (value: number) => signedIntegerFormat.format(value)
export const formatDate = (iso: string) => dateFormat.format(new Date(iso))
export const formatShortDate = (iso: string) => shortDateFormat.format(new Date(iso))

// Date d'un relevé ("2026-10-06"), interprétée à midi pour éviter tout décalage de jour.
export const formatDay = (day: string) => dateFormat.format(new Date(`${day}T12:00:00Z`))
