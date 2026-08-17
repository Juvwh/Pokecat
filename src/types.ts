/**
 * Modèle de données Pokécat.
 *
 * Firestore :
 *   cats/{catId}                -> Cat (document léger : contient une miniature)
 *   cats/{catId}/photos/{id}    -> CatPhoto (photos pleine taille, chargées à la demande)
 *   cats/{catId}/sightings/{id} -> Sighting (historique des rencontres)
 */

/** Les "badges" de caractère d'un chat, façon types Pokémon. */
export type CatTrait = 'caressable' | 'marrant' | 'grosLard' | 'sauvage' | 'bavard' | 'chasseur'

/**
 * Palette pastel accordée aux deux couleurs de marque (#a9e8fc / #f0cbf0).
 * Les badges affichent du texte foncé par-dessus : garder des teintes claires.
 */
export const TRAITS: { id: CatTrait; label: string; emoji: string; color: string }[] = [
  { id: 'caressable', label: 'Se laisse caresser', emoji: '🤲', color: '#c3f0d8' },
  { id: 'marrant', label: 'Marrant', emoji: '🤣', color: '#ffe9b0' },
  { id: 'grosLard', label: 'Gros lard', emoji: '🍖', color: '#ffd7c2' },
  { id: 'sauvage', label: 'Sauvage', emoji: '💢', color: '#f0cbf0' },
  { id: 'bavard', label: 'Bavard', emoji: '🗣️', color: '#a9e8fc' },
  { id: 'chasseur', label: 'Chasseur', emoji: '🐭', color: '#e6ddcd' },
]

export interface CatLocation {
  lat: number
  lng: number
}

export interface Cat {
  id: string
  /** Numéro de Pokédex, attribué à la création (001, 002, ...). */
  number: number
  name: string
  /** Adresse lisible, saisie à la main ou remplie par le géocodage inverse. */
  address: string
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
export type CatDraft = Pick<
  Cat,
  'name' | 'address' | 'location' | 'traits' | 'rarity' | 'notes'
>
