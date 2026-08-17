import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { useAuth } from '../context/AuthContext'
import { useCats } from '../context/CatsContext'
import {
  addPhotoToCat,
  addSighting,
  deleteCat,
  deletePhoto,
  deleteSighting,
  fetchPhotos,
  fetchSightings,
  syncSightingSummary,
} from '../lib/cats'
import { processPhoto } from '../lib/image'
import { formatDate, formatRelative } from '../lib/time'
import type { CatPhoto, Sighting } from '../types'
import { TRAITS } from '../types'
import { Badges } from '../components/Badges'
import { padNumber } from '../components/CatCard'
import { catPin, TILE_ATTRIBUTION, TILE_URL } from '../components/map'
import { SightingHistory } from '../components/SightingHistory'
import { Alert, Loading } from '../components/States'

export function CatDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { cats, loading } = useCats()
  const { user } = useAuth()
  const cat = cats.find((c) => c.id === id)

  const [photos, setPhotos] = useState<CatPhoto[]>([])
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    Promise.all([fetchPhotos(id), fetchSightings(id)])
      .then(([p, s]) => {
        if (!cancelled) {
          setPhotos(p)
          setSightings(s)
          setActiveIndex(0)
        }
      })
      .catch((err: Error) => !cancelled && setError(`Chargement partiel : ${err.message}`))
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading && !cat) return <Loading label="Chargement de la fiche…" />
  if (!cat) return <Alert>Ce chat est introuvable. Il a peut-être été supprimé.</Alert>

  const active = photos[activeIndex]
  const hero = active?.dataUrl ?? cat.thumbnail

  async function addPhoto(file: File | undefined) {
    if (!file || !cat) return
    setBusy(true)
    setError(null)
    try {
      const processed = await processPhoto(file)
      await addPhotoToCat(cat.id, processed, photos.length, Boolean(cat.thumbnail))
      setPhotos(await fetchPhotos(cat.id))
    } catch (err) {
      setError(`Ajout impossible : ${(err as Error).message}`)
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function removePhoto() {
    if (!cat || !active) return
    if (!confirm('Supprimer cette photo ?')) return
    setBusy(true)
    try {
      await deletePhoto(cat.id, active.id, photos.length - 1)
      const next = await fetchPhotos(cat.id)
      setPhotos(next)
      setActiveIndex(0)
    } catch (err) {
      setError(`Suppression impossible : ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  async function removeCat() {
    if (!cat) return
    if (!confirm(`Supprimer définitivement « ${cat.name} » du Pokédex ?`)) return
    setBusy(true)
    try {
      await deleteCat(cat.id, photos.map((p) => p.id), sightings.map((s) => s.id))
      navigate('/', { replace: true })
    } catch (err) {
      setError(`Suppression impossible : ${(err as Error).message}`)
      setBusy(false)
    }
  }

  /** Enregistre une nouvelle rencontre, puis met à jour le résumé du chat. */
  async function recordSighting(at: number, note: string) {
    if (!cat) return
    setBusy(true)
    setError(null)
    try {
      await addSighting(cat.id, { at, note, byEmail: user?.email ?? '' })
      const next = await fetchSightings(cat.id)
      setSightings(next)
      await syncSightingSummary(cat.id, next)
    } catch (err) {
      setError(`Enregistrement impossible : ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  async function removeSighting(sighting: Sighting) {
    if (!cat) return
    if (!confirm('Supprimer cette rencontre de l’historique ?')) return
    setBusy(true)
    try {
      await deleteSighting(cat.id, sighting.id)
      const next = await fetchSightings(cat.id)
      setSightings(next)
      await syncSightingSummary(cat.id, next)
    } catch (err) {
      setError(`Suppression impossible : ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  const traitLabels = TRAITS.filter((t) => cat.traits.includes(t.id))
  const cuddly = cat.traits.includes('caressable')

  // Repli pour les chats enregistrés avant l'existence de l'historique :
  // on reconstitue une première rencontre à partir du résumé du document.
  const history: Sighting[] =
    sightings.length > 0
      ? sightings
      : [
          {
            id: 'origine',
            at: cat.firstSeenAt,
            note: 'Première rencontre',
            byEmail: cat.createdByEmail,
          },
        ]

  return (
    <>
      <button type="button" className="back-link" onClick={() => navigate(-1)}>
        ← Retour au catalogue
      </button>

      <div className="panel">
        <div className="detail__hero">
          {hero ? (
            <img src={hero} alt={cat.name} onClick={() => setZoomed(true)} />
          ) : (
            <div className="detail__hero-empty" aria-hidden="true">🐈</div>
          )}
        </div>

        <div className="thumbs">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={i === activeIndex ? 'thumb thumb--active' : 'thumb'}
              onClick={() => setActiveIndex(i)}
            >
              <img src={p.dataUrl} alt={`Photo ${i + 1} de ${cat.name}`} />
            </button>
          ))}
          <button
            type="button"
            className="thumb thumb--add"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
            aria-label="Ajouter une photo"
          >
            +
          </button>
        </div>
        <input
          ref={fileInput}
          className="hidden-input"
          type="file"
          accept="image/*"
          onChange={(e) => addPhoto(e.target.files?.[0])}
        />

        <span className="detail__number">N°{padNumber(cat.number)}</span>
        <h2 className="detail__name">{cat.name}</h2>
        <Badges traits={cat.traits} />

        {/* Le chiffre le plus utile de la fiche : depuis combien de temps
            on ne l'a plus vu. */}
        <div className="last-seen">
          <span className="last-seen__label">Vu pour la dernière fois</span>
          <strong className="last-seen__value">{formatRelative(cat.lastSeenAt)}</strong>
          <span className="last-seen__date">{formatDate(cat.lastSeenAt)}</span>
        </div>

        <div className="stats">
          <div className="stat-row">
            <span className="stat-row__label">Adresse</span>
            <span className="stat-row__value">{cat.address || '—'}</span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">Caresses</span>
            <span className="stat-row__value">
              {cuddly ? '✅ Se laisse caresser' : '❌ Pas touche'}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">Caractère</span>
            <span className="stat-row__value">
              {traitLabels.length > 0 ? traitLabels.map((t) => t.label).join(' · ') : '—'}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">Rareté</span>
            <span className="stat-row__value rarity">
              {'⭐'.repeat(cat.rarity)}{'☆'.repeat(5 - cat.rarity)}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">Première rencontre</span>
            <span className="stat-row__value">{formatDate(cat.firstSeenAt)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">Croisé</span>
            <span className="stat-row__value">
              {cat.sightingCount} fois
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">Repéré par</span>
            <span className="stat-row__value">{cat.createdByEmail || '—'}</span>
          </div>
          {cat.notes && (
            <div className="stat-row stat-row--stacked">
              <span className="stat-row__label">Notes</span>
              <span className="stat-row__value">{cat.notes}</span>
            </div>
          )}
        </div>

        {cat.location && (
          <div className="map-wrap map-wrap--picker detail__map">
            <MapContainer
              center={[cat.location.lat, cat.location.lng]}
              zoom={16}
              scrollWheelZoom={false}
            >
              <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
              <Marker
                position={[cat.location.lat, cat.location.lng]}
                icon={catPin(cat.thumbnail)}
              />
            </MapContainer>
          </div>
        )}

        <SightingHistory
          sightings={history}
          busy={busy}
          onAdd={recordSighting}
          onDelete={removeSighting}
        />

        {error && <Alert>{error}</Alert>}

        <div className="btn-row">
          <button className="btn" onClick={() => navigate(`/chat/${cat.id}/modifier`)}>
            ✏️ Modifier
          </button>
          {active && (
            <button className="btn btn--outline" onClick={removePhoto} disabled={busy}>
              🗑️ Photo
            </button>
          )}
          <button className="btn btn--danger" onClick={removeCat} disabled={busy}>
            ❌ Supprimer
          </button>
        </div>
      </div>

      {zoomed && hero && (
        <button className="lightbox" onClick={() => setZoomed(false)} aria-label="Fermer">
          <img src={hero} alt={cat.name} />
        </button>
      )}
    </>
  )
}
