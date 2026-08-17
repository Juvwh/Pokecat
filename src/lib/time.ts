/** Formatage des dates de rencontre, en français. */

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** « aujourd'hui », « hier », « il y a 3 jours », « il y a 2 mois »… */
export function formatRelative(timestamp: number, now = Date.now()): string {
  const diff = now - timestamp
  if (diff < 0) return 'à venir'
  if (diff < MINUTE) return "à l'instant"
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE)
    return `il y a ${m} min`
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR)
    return `il y a ${h} h`
  }

  // Au-delà de 24 h, on raisonne en jours calendaires : croiser un chat hier soir
  // et le revoir ce matin doit afficher « hier », pas « il y a 1 jour ».
  const days = calendarDaysBetween(timestamp, now)
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} jours`
  if (days < 31) {
    const w = Math.floor(days / 7)
    return `il y a ${w} semaine${w > 1 ? 's' : ''}`
  }
  if (days < 365) {
    const m = Math.max(1, Math.round(days / 30.44))
    return `il y a ${m} mois`
  }
  const y = Math.floor(days / 365.25)
  return `il y a ${y} an${y > 1 ? 's' : ''}`
}

function startOfDay(timestamp: number): number {
  const d = new Date(timestamp)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function calendarDaysBetween(from: number, to: number): number {
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY)
}

/** « 17 août 2026 » */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('fr-BE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** « 17 août 2026 à 14:32 » */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('fr-BE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Timestamp -> valeur d'un `<input type="date">` (AAAA-MM-JJ, en heure locale). */
export function toDateInput(timestamp: number): string {
  const d = new Date(timestamp)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Valeur d'un `<input type="date">` -> timestamp.
 * Si la date choisie est aujourd'hui, on garde l'heure courante : « il y a 2 h »
 * est plus utile que « aujourd'hui à 00:00 ».
 */
export function fromDateInput(value: string, now = Date.now()): number {
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return now
  const picked = new Date(y, m - 1, d, 0, 0, 0, 0)
  return startOfDay(now) === picked.getTime() ? now : picked.getTime()
}
