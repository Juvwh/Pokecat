/** Géolocalisation du navigateur + géocodage inverse via Nominatim (OpenStreetMap, gratuit). */

export interface Coords {
  lat: number
  lng: number
}

/**
 * Position par défaut de la carte quand aucun chat n'est encore enregistré :
 * Profondsart (hameau de Limal, Wavre), coordonnées OpenStreetMap.
 */
export const DEFAULT_CENTER: Coords = { lat: 50.6954, lng: 4.5478 }

export function getCurrentPosition(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error("La géolocalisation n'est pas disponible sur cet appareil."))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? "Accès à la position refusé. Tu peux placer le point à la main sur la carte."
              : "Position introuvable. Tu peux placer le point à la main sur la carte.",
          ),
        ),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    )
  })
}

/** Coordonnées -> adresse lisible. Renvoie null en cas d'échec (le service est best-effort). */
export async function reverseGeocode({ lat, lng }: Coords): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fr`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null

    const data = await res.json()
    const a = data.address ?? {}
    const parts = [
      [a.house_number, a.road].filter(Boolean).join(' '),
      a.city ?? a.town ?? a.village ?? a.municipality,
    ].filter(Boolean)

    return parts.length > 0 ? parts.join(', ') : (data.display_name ?? null)
  } catch {
    return null
  }
}
