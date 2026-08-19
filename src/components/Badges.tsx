import { traitColor, traitLabel } from '../types'
import type { CatTrait } from '../types'

interface Props {
  traits: CatTrait[]
  /** `dot` = pastilles compactes (initiales seules) pour le catalogue. */
  variant?: 'full' | 'dot'
}

export function Badges({ traits, variant = 'full' }: Props) {
  if (traits.length === 0) return null

  return (
    <div className="badges">
      {traits.map((raw, i) => {
        const label = traitLabel(raw)
        return (
          <span
            key={`${label}-${i}`}
            className={variant === 'dot' ? 'badge badge--dot' : 'badge'}
            style={{ '--badge-color': traitColor(label) } as React.CSSProperties}
            title={label}
          >
            {variant === 'full' ? label : <span aria-hidden="true">{initials(label)}</span>}
            {variant === 'dot' && <span className="sr-only">{label}</span>}
          </span>
        )
      })}
    </div>
  )
}

/**
 * Les traits étant désormais libres, ils n'ont plus d'emoji : la pastille
 * compacte du catalogue affiche la ou les premières lettres du libellé.
 */
function initials(label: string): string {
  const words = label.split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}
