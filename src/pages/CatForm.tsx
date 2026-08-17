import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TRAITS } from '../types'
import type { CatDraft, CatTrait } from '../types'
import { useAuth } from '../context/AuthContext'
import { useCats } from '../context/CatsContext'
import { createCat, updateCat } from '../lib/cats'
import { processPhoto } from '../lib/image'
import type { ProcessedPhoto } from '../lib/image'
import { DEFAULT_CENTER, getCurrentPosition, reverseGeocode } from '../lib/geo'
import type { Coords } from '../lib/geo'
import { fromDateInput, toDateInput } from '../lib/time'
import { MapPicker } from '../components/map'
import { Alert, Loading } from '../components/States'
import { padNumber } from '../components/CatCard'

const EMPTY_DRAFT: CatDraft = {
  name: '',
  address: '',
  location: null,
  traits: [],
  rarity: 3,
  notes: '',
}

const MAX_NEW_PHOTOS = 6

/** Formulaire partagé : création (`/nouveau`) et modification (`/chat/:id/modifier`). */
export function CatForm({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { cats, loading, nextNumber } = useCats()

  const existing = mode === 'edit' ? cats.find((c) => c.id === id) : undefined

  const [draft, setDraft] = useState<CatDraft | null>(null)
  const [photos, setPhotos] = useState<ProcessedPhoto[]>([])
  // Date de la première rencontre : modifiable à la création seulement.
  // Ensuite, l'historique se gère depuis la fiche du chat.
  const [firstSeen, setFirstSeen] = useState(() => toDateInput(Date.now()))
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState<false | 'photo' | 'gps' | 'save'>(false)

  const galleryInput = useRef<HTMLInputElement>(null)
  const cameraInput = useRef<HTMLInputElement>(null)

  // On initialise l'état une seule fois, dès que les données sont disponibles.
  const value = draft ?? (existing ? toDraft(existing) : mode === 'create' ? EMPTY_DRAFT : null)

  const mapCenter = useMemo<Coords>(() => {
    if (value?.location) return value.location
    const withLocation = cats.find((c) => c.location)
    return withLocation?.location ?? DEFAULT_CENTER
  }, [value?.location, cats])

  if (mode === 'edit' && loading && !existing) return <Loading label="Chargement de la fiche…" />
  if (mode === 'edit' && !existing) return <Alert>Ce chat est introuvable. Il a peut-être été supprimé.</Alert>
  if (!value) return <Loading />

  function patch(changes: Partial<CatDraft>) {
    setDraft({ ...(value as CatDraft), ...changes })
  }

  function toggleTrait(trait: CatTrait) {
    const traits = value!.traits.includes(trait)
      ? value!.traits.filter((t) => t !== trait)
      : [...value!.traits, trait]
    patch({ traits })
  }

  async function useMyPosition() {
    setBusy('gps')
    setError(null)
    setInfo(null)
    try {
      const coords = await getCurrentPosition()
      const address = await reverseGeocode(coords)
      patch({ location: coords, ...(address && !value!.address ? { address } : {}) })
      setInfo(address ? `Position trouvée : ${address}` : 'Position trouvée.')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function pickOnMap(coords: Coords) {
    patch({ location: coords })
    // On ne remplit l'adresse automatiquement que si elle est encore vide,
    // pour ne pas écraser ce qui a été tapé à la main.
    if (!value!.address) {
      const address = await reverseGeocode(coords)
      if (address) setDraft((d) => ({ ...(d ?? value!), location: coords, address }))
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setBusy('photo')
    setError(null)
    try {
      const room = MAX_NEW_PHOTOS - photos.length
      const selected = Array.from(files).slice(0, room)
      const processed = await Promise.all(selected.map(processPhoto))
      setPhotos((p) => [...p, ...processed])
      if (files.length > room) {
        setInfo(`Seules ${room} photo(s) ont été ajoutées (maximum ${MAX_NEW_PHOTOS}).`)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
      if (galleryInput.current) galleryInput.current.value = ''
      if (cameraInput.current) cameraInput.current.value = ''
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!value!.name.trim()) {
      setError('Donne au moins un nom à ce chat (même inventé !).')
      return
    }
    setBusy('save')
    setError(null)
    try {
      const clean: CatDraft = { ...value!, name: value!.name.trim(), address: value!.address.trim() }
      if (mode === 'edit' && existing) {
        await updateCat(existing.id, clean)
        navigate(`/chat/${existing.id}`, { replace: true })
      } else {
        const newId = await createCat({
          ...clean,
          photos,
          number: nextNumber,
          firstSeenAt: fromDateInput(firstSeen),
          createdBy: user?.uid ?? '',
          createdByEmail: user?.email ?? '',
        })
        navigate(`/chat/${newId}`, { replace: true })
      }
    } catch (err) {
      setError(`Enregistrement impossible : ${(err as Error).message}`)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <button type="button" className="back-link" onClick={() => navigate(-1)}>
        ← Retour
      </button>

      <div className="panel">
        <h2 className="panel__title">
          {mode === 'edit'
            ? `Modifier N°${padNumber(existing!.number)}`
            : `Nouvelle capture — N°${padNumber(nextNumber)}`}
        </h2>

        <div className="field">
          <label className="field__label" htmlFor="name">Nom du chat</label>
          <input
            id="name"
            className="input"
            value={value.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="Valva, Dimitri, ..."
            maxLength={60}
          />
        </div>

        {mode === 'create' && (
          <div className="field">
            <span className="field__label">Photos</span>
            <div className="photo-strip">
              {photos.map((p, i) => (
                <div className="photo-slot" key={i}>
                  <img src={p.thumbnail} alt={`Photo ${i + 1}`} />
                  <button
                    type="button"
                    className="photo-slot__remove"
                    onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                    aria-label="Retirer cette photo"
                  >
                    ×
                  </button>
                </div>
              ))}

              {photos.length < MAX_NEW_PHOTOS && (
                <>
                  <button
                    type="button"
                    className="photo-slot photo-slot--add"
                    onClick={() => cameraInput.current?.click()}
                    disabled={busy === 'photo'}
                  >
                    <span aria-hidden="true">📸</span>
                    <span>Photo</span>
                  </button>
                  <button
                    type="button"
                    className="photo-slot photo-slot--add"
                    onClick={() => galleryInput.current?.click()}
                    disabled={busy === 'photo'}
                  >
                    <span aria-hidden="true">🖼️</span>
                    <span>Galerie</span>
                  </button>
                </>
              )}
            </div>
            {/* Seul le retour pendant le travail est affiché : la compression
                elle-même n'a pas besoin d'être expliquée à l'utilisateur. */}
            {busy === 'photo' && <p className="field__hint">Compression en cours…</p>}

            {/* `capture="environment"` ouvre directement l'appareil photo sur mobile. */}
            <input
              ref={cameraInput}
              className="hidden-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <input
              ref={galleryInput}
              className="hidden-input"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        )}

        {mode === 'create' && (
          <div className="field">
            <label className="field__label" htmlFor="first-seen">
              Date de la première rencontre
            </label>
            <input
              id="first-seen"
              className="input"
              type="date"
              value={firstSeen}
              max={toDateInput(Date.now())}
              onChange={(e) => setFirstSeen(e.target.value)}
              required
            />
          </div>
        )}

        <div className="field">
          <label className="field__label" htmlFor="address">Adresse</label>
          <input
            id="address"
            className="input"
            value={value.address}
            onChange={(e) => patch({ address: e.target.value })}
            placeholder="Rue de Pied et Chaussette, Profondsart"
            maxLength={140}
          />
        </div>

        <div className="field">
          <span className="field__label">Lieu de la rencontre</span>
          <MapPicker value={value.location} center={mapCenter} onPick={pickOnMap} />
          <p className="field__hint">
            Tape sur la carte pour placer le point.
            {value.location &&
              ` (${value.location.lat.toFixed(5)}, ${value.location.lng.toFixed(5)})`}
          </p>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn--outline"
              onClick={useMyPosition}
              disabled={busy === 'gps'}
            >
              {busy === 'gps' ? '📡 Recherche…' : '📍 Ma position'}
            </button>
            {value.location && (
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => patch({ location: null })}
              >
                ✖ Effacer le point
              </button>
            )}
          </div>
        </div>

        <div className="field">
          <span className="field__label">Caractère</span>
          <div className="trait-grid">
            {TRAITS.map((t) => {
              const on = value.traits.includes(t.id)
              return (
                <button
                  key={t.id}
                  type="button"
                  className={on ? 'trait-toggle trait-toggle--on' : 'trait-toggle'}
                  style={{ '--trait-color': t.color } as React.CSSProperties}
                  aria-pressed={on}
                  onClick={() => toggleTrait(t.id)}
                >
                  <span aria-hidden="true">{t.emoji}</span>
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="field">
          <span className="field__label">Rareté de la rencontre</span>
          <div className="rarity-picker">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                // La classe colore toutes les étoiles jusqu'au niveau choisi,
                // alors que `aria-pressed` ne marque que le bouton sélectionné.
                className={n <= value.rarity ? 'is-on' : undefined}
                aria-pressed={value.rarity === n}
                aria-label={`${n} sur 5`}
                onClick={() => patch({ rarity: n })}
              >
                {n <= value.rarity ? '⭐' : '☆'}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            className="textarea"
            value={value.notes}
            onChange={(e) => patch({ notes: e.target.value })}
            placeholder="Il ronronnait dès qu'on approchait la main…"
            maxLength={600}
          />
        </div>

        {error && <Alert>{error}</Alert>}
        {info && <Alert variant="info">{info}</Alert>}

        <button className="btn btn--primary btn--block" type="submit" disabled={busy !== false}>
          {busy === 'save' ? 'Enregistrement…' : mode === 'edit' ? '💾 Enregistrer' : '🎉 Ajouter au PokéCat'}
        </button>
      </div>
    </form>
  )
}

function toDraft(cat: { name: string; address: string; location: Coords | null; traits: CatTrait[]; rarity: number; notes: string }): CatDraft {
  return {
    name: cat.name,
    address: cat.address,
    location: cat.location,
    traits: cat.traits,
    rarity: cat.rarity,
    notes: cat.notes,
  }
}
