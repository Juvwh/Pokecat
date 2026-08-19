/** Géolocalisation du navigateur. Les chats ne portent qu'un point sur la carte, pas d'adresse. */

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
