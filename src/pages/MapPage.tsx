import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { filterCats, useCats } from '../context/CatsContext'
import { DEFAULT_CENTER, getCurrentPosition } from '../lib/geo'
import type { Coords } from '../lib/geo'
import { catPin, Recenter, TILE_ATTRIBUTION, TILE_URL } from '../components/map'
import { padNumber } from '../components/CatCard'
import { Alert, EmptyState, Loading } from '../components/States'

/** Onglet carte : tous les points de rencontre, filtrés par la même barre de recherche. */
export function MapPage({ search }: { search: string }) {
  const { cats, loading, error } = useCats()
  const [target, setTarget] = useState<Coords | null>(null)
  const [gpsError, setGpsError] = useState<string | null>(null)

  const located = useMemo(
    () => filterCats(cats, search).filter((c) => c.location),
    [cats, search],
  )

  const center = useMemo<Coords>(
    () => located[0]?.location ?? cats.find((c) => c.location)?.location ?? DEFAULT_CENTER,
    [located, cats],
  )

  if (loading) return <Loading label="Chargement de la carte…" />
  if (error) return <Alert>{error}</Alert>

  async function goToMe() {
    setGpsError(null)
    try {
      setTarget(await getCurrentPosition())
    } catch (err) {
      setGpsError((err as Error).message)
    }
  }

  return (
    <div className="panel">
      <h2 className="panel__title">
        Carte des rencontres
        {cats.length > 0 && ` — ${located.length} point${located.length > 1 ? 's' : ''}`}
      </h2>

      {gpsError && <Alert>{gpsError}</Alert>}

      {cats.length === 0 ? (
        <EmptyState
          emoji="🗺️"
          title="Carte vide"
          message="Ajoute un premier chat avec un point sur la carte pour le voir apparaître ici."
        />
      ) : (
        <>
          <div className="map-wrap map-wrap--page">
            <MapContainer center={[center.lat, center.lng]} zoom={14} scrollWheelZoom>
              <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
              <Recenter center={target} zoom={16} />
              {located.map((cat) => (
                <Marker
                  key={cat.id}
                  position={[cat.location!.lat, cat.location!.lng]}
                  icon={catPin(cat.thumbnail)}
                >
                  <Popup>
                    <div className="map-popup">
                      {cat.thumbnail && <img src={cat.thumbnail} alt={cat.name} />}
                      <span className="map-popup__number">N°{padNumber(cat.number)}</span>
                      <span className="map-popup__name">{cat.name}</span>
                      <div>{cat.address || 'Adresse inconnue'}</div>
                      <Link to={`/chat/${cat.id}`}>Voir la fiche →</Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="btn-row">
            <button className="btn btn--outline" onClick={goToMe}>📍 Me localiser</button>
          </div>

          {located.length === 0 && (
            <p className="field__hint" style={{ marginTop: 10 }}>
              Aucun chat de la recherche n’a de point sur la carte.
            </p>
          )}
        </>
      )}
    </div>
  )
}
