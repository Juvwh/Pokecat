import { Link } from 'react-router-dom'
import type { Cat } from '../types'
import { formatRelative } from '../lib/time'
import { Badges } from './Badges'

export function padNumber(n: number): string {
  return String(n).padStart(3, '0')
}

/** `featured` : le tout premier chat du dex, épinglé et mis en avant. */
export function CatCard({ cat, featured = false }: { cat: Cat; featured?: boolean }) {
  return (
    <Link
      className={featured ? 'cat-card cat-card--featured' : 'cat-card'}
      to={`/chat/${cat.id}`}
    >
      <div className="cat-card__media">
        {cat.thumbnail ? (
          <img src={cat.thumbnail} alt={cat.name} loading="lazy" />
        ) : (
          <span className="cat-card__placeholder" aria-hidden="true">🐈</span>
        )}
        <span className="cat-card__number">N°{padNumber(cat.number)}</span>
        {cat.sightingCount > 1 && (
          <span className="cat-card__count" title={`Croisé ${cat.sightingCount} fois`}>
            ×{cat.sightingCount}
          </span>
        )}
      </div>
      <div className="cat-card__body">
        <p className="cat-card__name">{cat.name}</p>
        <p className="cat-card__seen">👀 {formatRelative(cat.lastSeenAt)}</p>
        <Badges traits={cat.traits} variant="dot" />
      </div>
    </Link>
  )
}
