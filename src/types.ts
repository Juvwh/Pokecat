/**
 * Modèle de données Pokécat.
 *
 * Firestore :
 *   cats/{catId}                -> Cat (document léger : contient une miniature)
 *   cats/{catId}/photos/{id}    -> CatPhoto (photos pleine taille, chargées à la demande)
 *   cats/{catId}/sightings/{id} -> Sighting (historique des rencontres)
 */

/**
 * Un trait de caractère est un **libellé libre** : « Chasseur », « Adore les
 * voitures »… Il n'y a plus de catalogue figé, on invente les catégories au
 * moment de remplir la fiche. Seul `CUDDLY_TRAIT` est spécial (bouton dédié
 * dans le formulaire, ligne « Caresses » sur la fiche).
 */
export type CatTrait = string

export const CUDDLY_TRAIT = 'Se laisse caresser'

/**
 * Les six traits d'origine étaient stockés sous forme d'identifiants.
 * Les documents déjà en base les contiennent encore : on les retraduit en
 * libellés à la lecture (`toCat`) pour n'avoir qu'un seul format en mémoire.
 */
const LEGACY_TRAIT_LABELS: Record<string, string> = {
  caressable: CUDDLY_TRAIT,
  marrant: 'Marrant',
  grosLard: 'Gros lard',
  sauvage: 'Sauvage',
  bavard: 'Bavard',
  chasseur: 'Chasseur',
}

/** Suggestions proposées tant qu'aucun chat du dex ne porte encore de trait. */
export const TRAIT_SUGGESTIONS = ['Marrant', 'Gros lard', 'Sauvage', 'Bavard', 'Chasseur']

/** Identifiant ou libellé -> libellé affichable. */
export function traitLabel(raw: string): string {
  return LEGACY_TRAIT_LABELS[raw] ?? raw.trim()
}

/** Clé de comparaison : deux traits ne diffèrent ni par la casse ni par les accents. */
export function traitKey(raw: string): string {
  return traitLabel(raw)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

/**
 * Palette pastel accordée aux deux couleurs de marque (#a9e8fc / #f0cbf0).
 * Les badges affichent du texte foncé par-dessus : garder des teintes claires.
 */
const TRAIT_COLORS = [
  '#ffe9b0',
  '#ffd7c2',
  '#f0cbf0',
  '#a9e8fc',
  '#e6ddcd',
  '#d7d9fb',
  '#cdeccb',
  '#ffd0dd',
]

/**
 * Couleur déterministe déduite du libellé : un trait inventé garde la même
 * pastille d'un écran à l'autre et d'un appareil à l'autre, sans rien stocker.
 */
export function traitColor(raw: string): string {
  const key = traitKey(raw)
  if (key === traitKey(CUDDLY_TRAIT)) return '#c3f0d8'
  let hash = 0
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % 100_000
  return TRAIT_COLORS[hash % TRAIT_COLORS.length]
}

export interface CatLocation {
  lat: number
  lng: number
}

export interface Cat {
  id: string
  /** Numéro de Pokédex, attribué à la création (001, 002, ...). */
  number: number
  name: string
  location: CatLocation | null
  traits: CatTrait[]
  /** Note de rencontre sur 5, façon "niveau de rareté". */
  rarity: number
  notes: string
  /** Miniature base64 (data URL) affichée dans le catalogue. */
  thumbnail: string | null
  photoCount: number
  /**
   * Résumé de l'historique des rencontres, dupliqué ici depuis la sous-collection
   * `sightings` pour que le catalogue puisse afficher « vu il y a 3 jours »
   * sans charger l'historique complet de chaque chat.
   */
  firstSeenAt: number
  lastSeenAt: number
  sightingCount: number
  /** UID + email de la personne qui a enregistré le chat. */
  createdBy: string
  createdByEmail: string
  createdAt: number
  updatedAt: number
}

export interface CatPhoto {
  id: string
  dataUrl: string
  createdAt: number
}

/** Une rencontre avec le chat. La toute première est créée en même temps que le chat. */
export interface Sighting {
  id: string
  /** Date de la rencontre (pas la date de saisie). */
  at: number
  note: string
  /** Qui a croisé le chat ce jour-là. */
  byEmail: string
}

/** Champs éditables depuis le formulaire. */
export type CatDraft = Pick<Cat, 'name' | 'location' | 'traits' | 'rarity' | 'notes'>
