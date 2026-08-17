import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import type { Coords } from '../lib/geo'

/** Fond de carte OpenStreetMap : gratuit et sans clé API. */
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_ATTRIBUTION = '&copy; OpenStreetMap'

/** Marqueur "pin" custom : la miniature du chat dans une goutte façon Pokédex. */
export function catPin(thumbnail: string | null): L.DivIcon {
  const inner = thumbnail
    ? `<img src="${thumbnail}" alt="" />`
    : '<span>🐈</span>'
  return L.divIcon({
    className: 'map-pin',
    html: `<div class="map-pin__inner">${inner}</div>`,
    iconSize: [38, 38],
    iconAnchor: [10, 38],
    popupAnchor: [8, -36],
  })
}

/** Recentre la carte quand la cible change (ex. après "Ma position"). */
export function Recenter({ center, zoom }: { center: Coords | null; zoom?: number }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView([center.lat, center.lng], zoom ?? map.getZoom())
  }, [center, zoom, map])
  return null
}

/** Pose / déplace le marqueur au clic sur la carte. */
function ClickHandler({ onPick }: { onPick: (coords: Coords) => void }) {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  })
  return null
}

interface PickerProps {
  value: Coords | null
  center: Coords
  onPick: (coords: Coords) => void
}

/** Mini-carte du formulaire : on tape sur la carte pour placer le point de rencontre. */
export function MapPicker({ value, center, onPick }: PickerProps) {
  return (
    <div className="map-wrap map-wrap--picker">
      <MapContainer center={[center.lat, center.lng]} zoom={16} scrollWheelZoom>
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <ClickHandler onPick={onPick} />
        <Recenter center={value ?? center} />
        {value && <Marker position={[value.lat, value.lng]} icon={catPin(null)} />}
      </MapContainer>
    </div>
  )
}
