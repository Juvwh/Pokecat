import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Cat, CatDraft, CatPhoto, Sighting } from '../types'
import type { ProcessedPhoto } from './image'

const CATS = 'cats'

function toCat(id: string, data: Record<string, unknown>): Cat {
  const createdAt = (data.createdAt as number) ?? 0
  return {
    id,
    number: (data.number as number) ?? 0,
    name: (data.name as string) ?? 'Chat mystère',
    address: (data.address as string) ?? '',
    location: (data.location as Cat['location']) ?? null,
    traits: (data.traits as Cat['traits']) ?? [],
    rarity: (data.rarity as number) ?? 3,
    notes: (data.notes as string) ?? '',
    thumbnail: (data.thumbnail as string) ?? null,
    photoCount: (data.photoCount as number) ?? 0,
    // Valeurs de repli pour les chats enregistrés avant l'ajout de l'historique.
    firstSeenAt: (data.firstSeenAt as number) ?? createdAt,
    lastSeenAt: (data.lastSeenAt as number) ?? createdAt,
    sightingCount: (data.sightingCount as number) ?? 1,
    createdBy: (data.createdBy as string) ?? '',
    createdByEmail: (data.createdByEmail as string) ?? '',
    createdAt,
    updatedAt: (data.updatedAt as number) ?? 0,
  }
}

/**
 * Écoute la collection en temps réel : dès que l'un de vous deux ajoute un chat,
 * il apparaît sur l'écran de l'autre sans rechargement.
 */
export function subscribeToCats(
  onData: (cats: Cat[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(collection(db, CATS), orderBy('number', 'desc'))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => toCat(d.id, d.data()))),
    onError,
  )
}

export interface CreateCatInput extends CatDraft {
  photos: ProcessedPhoto[]
  /** Numéro de Pokédex suivant, calculé à partir de la liste déjà chargée. */
  number: number
  /** Date de la toute première rencontre, choisie dans le formulaire. */
  firstSeenAt: number
  createdBy: string
  createdByEmail: string
}

export async function createCat(input: CreateCatInput): Promise<string> {
  const now = Date.now()
  const ref = await addDoc(collection(db, CATS), {
    number: input.number,
    name: input.name,
    address: input.address,
    location: input.location,
    traits: input.traits,
    rarity: input.rarity,
    notes: input.notes,
    thumbnail: input.photos[0]?.thumbnail ?? null,
    photoCount: input.photos.length,
    firstSeenAt: input.firstSeenAt,
    lastSeenAt: input.firstSeenAt,
    sightingCount: 1,
    createdBy: input.createdBy,
    createdByEmail: input.createdByEmail,
    createdAt: now,
    updatedAt: now,
  })

  await Promise.all([
    ...input.photos.map((p) => addPhotoDoc(ref.id, p.full)),
    // La création vaut première rencontre : elle ouvre l'historique.
    addSighting(ref.id, {
      at: input.firstSeenAt,
      note: 'Première rencontre',
      byEmail: input.createdByEmail,
    }),
  ])
  return ref.id
}

export async function updateCat(catId: string, draft: CatDraft): Promise<void> {
  await updateDoc(doc(db, CATS, catId), { ...draft, updatedAt: Date.now() })
}

export async function deleteCat(
  catId: string,
  photoIds: string[],
  sightingIds: string[],
): Promise<void> {
  // Firestore ne supprime pas les sous-collections automatiquement.
  await Promise.all([
    ...photoIds.map((id) => deleteDoc(doc(db, CATS, catId, 'photos', id))),
    ...sightingIds.map((id) => deleteDoc(doc(db, CATS, catId, 'sightings', id))),
  ])
  await deleteDoc(doc(db, CATS, catId))
}

/* ---------- Photos ---------- */

async function addPhotoDoc(catId: string, dataUrl: string): Promise<string> {
  const ref = await addDoc(collection(db, CATS, catId, 'photos'), {
    dataUrl,
    createdAt: Date.now(),
  })
  return ref.id
}

/** Ajoute une photo à un chat existant (et pose la miniature s'il n'en avait pas). */
export async function addPhotoToCat(
  catId: string,
  photo: ProcessedPhoto,
  currentPhotoCount: number,
  hasThumbnail: boolean,
): Promise<void> {
  await addPhotoDoc(catId, photo.full)
  await updateDoc(doc(db, CATS, catId), {
    photoCount: currentPhotoCount + 1,
    updatedAt: Date.now(),
    ...(hasThumbnail ? {} : { thumbnail: photo.thumbnail }),
  })
}

export async function deletePhoto(
  catId: string,
  photoId: string,
  remainingCount: number,
): Promise<void> {
  await deleteDoc(doc(db, CATS, catId, 'photos', photoId))
  await updateDoc(doc(db, CATS, catId), {
    photoCount: Math.max(0, remainingCount),
    updatedAt: Date.now(),
  })
}

/** Les photos pleine taille sont lourdes : on ne les charge que sur la fiche du chat. */
export async function fetchPhotos(catId: string): Promise<CatPhoto[]> {
  const snap = await getDocs(
    query(collection(db, CATS, catId, 'photos'), orderBy('createdAt', 'asc')),
  )
  return snap.docs.map((d) => ({
    id: d.id,
    dataUrl: d.data().dataUrl as string,
    createdAt: (d.data().createdAt as number) ?? 0,
  }))
}

/* ---------- Historique des rencontres ---------- */

export async function addSighting(
  catId: string,
  sighting: Omit<Sighting, 'id'>,
): Promise<string> {
  const ref = await addDoc(collection(db, CATS, catId, 'sightings'), sighting)
  return ref.id
}

export async function deleteSighting(catId: string, sightingId: string): Promise<void> {
  await deleteDoc(doc(db, CATS, catId, 'sightings', sightingId))
}

/** Historique complet, de la rencontre la plus récente à la plus ancienne. */
export async function fetchSightings(catId: string): Promise<Sighting[]> {
  const snap = await getDocs(
    query(collection(db, CATS, catId, 'sightings'), orderBy('at', 'desc')),
  )
  return snap.docs.map((d) => ({
    id: d.id,
    at: (d.data().at as number) ?? 0,
    note: (d.data().note as string) ?? '',
    byEmail: (d.data().byEmail as string) ?? '',
  }))
}

/**
 * Recopie le résumé de l'historique sur le document du chat.
 * À appeler après chaque ajout ou suppression de rencontre : c'est ce résumé
 * qu'affichent le catalogue et la carte, sans lire la sous-collection.
 */
export async function syncSightingSummary(
  catId: string,
  sightings: Sighting[],
): Promise<void> {
  if (sightings.length === 0) return
  const dates = sightings.map((s) => s.at)
  await updateDoc(doc(db, CATS, catId), {
    firstSeenAt: Math.min(...dates),
    lastSeenAt: Math.max(...dates),
    sightingCount: sightings.length,
    updatedAt: Date.now(),
  })
}
