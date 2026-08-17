/**
 * Compression d'images côté navigateur.
 *
 * Pourquoi : les photos sont stockées directement dans Firestore (en base64),
 * pour éviter d'avoir à activer Firebase Storage (qui demande une carte bancaire).
 * Un document Firestore est limité à 1 Mo, donc on redimensionne et on compresse
 * avant d'enregistrer. Voir AGENTS.md pour le raisonnement complet.
 */

const PHOTO_MAX_SIDE = 1280
const PHOTO_QUALITY = 0.72
const THUMB_MAX_SIDE = 400
const THUMB_QUALITY = 0.6

/** Marge de sécurité sous la limite Firestore de 1 048 576 octets par document. */
const MAX_PHOTO_BYTES = 700_000

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Impossible de lire cette image."))
    }
    img.src = url
  })
}

function draw(img: HTMLImageElement, maxSide: number, quality: number): string {
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error("Le navigateur ne supporte pas le canvas.")
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  return canvas.toDataURL('image/jpeg', quality)
}

export interface ProcessedPhoto {
  /** Photo pleine taille (sous-collection `photos`). */
  full: string
  /** Miniature stockée sur le document du chat, pour un catalogue rapide. */
  thumbnail: string
}

/** Redimensionne + compresse une photo, en réduisant la qualité si le poids dépasse la limite. */
export async function processPhoto(file: File): Promise<ProcessedPhoto> {
  const img = await loadImage(file)

  let quality = PHOTO_QUALITY
  let maxSide = PHOTO_MAX_SIDE
  let full = draw(img, maxSide, quality)

  // Certaines photos de téléphone restent lourdes même redimensionnées :
  // on réduit progressivement jusqu'à passer sous la limite Firestore.
  while (full.length > MAX_PHOTO_BYTES && quality > 0.35) {
    quality -= 0.12
    maxSide = Math.round(maxSide * 0.85)
    full = draw(img, maxSide, quality)
  }

  return { full, thumbnail: draw(img, THUMB_MAX_SIDE, THUMB_QUALITY) }
}
