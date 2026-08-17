import { TRAITS } from '../types'
import type { CatTrait } from '../types'

interface Props {
  traits: CatTrait[]
  /** `dot` = pastilles emoji compactes pour le catalogue. */
  variant?: 'full' | 'dot'
}

export function Badges({ traits, variant = 'full' }: Props) {
  const active = TRAITS.filter((t) => traits.includes(t.id))
  if (active.length === 0) return null

  return (
    <div className="badges">
      {active.map((t) => (
        <span
          key={t.id}
          className={variant === 'dot' ? 'badge badge--dot' : 'badge'}
          style={{ '--badge-color': t.color } as React.CSSProperties}
          title={t.label}
        >
          <span aria-hidden="true">{t.emoji}</span>
          {variant === 'full' && t.label}
          {variant === 'dot' && <span className="sr-only">{t.label}</span>}
        </span>
      ))}
    </div>
  )
}
