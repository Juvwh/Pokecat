import { useState } from 'react'
import { CUDDLY_TRAIT, traitColor, traitKey, traitLabel } from '../types'

interface Props {
  traits: string[]
  /** Traits déjà utilisés ailleurs dans le dex : proposés en un tap. */
  suggestions: string[]
  onChange: (traits: string[]) => void
}

const MAX_TRAIT_LENGTH = 28

/**
 * Sélecteur de traits de caractère.
 *
 * Il n'y a plus de catalogue figé : on tape un libellé et il existe. Les traits
 * déjà posés sur d'autres chats sont proposés en dessous pour éviter d'avoir à
 * les retaper (et pour ne pas se retrouver avec « Chasseur » et « chasseur »).
 * Seul « Se laisse caresser » garde un bouton dédié : c'est l'information la
 * plus consultée, et la fiche lui réserve une ligne.
 */
export function TraitPicker({ traits, suggestions, onChange }: Props) {
  const [input, setInput] = useState('')

  const has = (label: string) => traits.some((t) => traitKey(t) === traitKey(label))

  function toggle(label: string) {
    onChange(has(label) ? traits.filter((t) => traitKey(t) !== traitKey(label)) : [...traits, label])
  }

  function add() {
    const label = traitLabel(input).slice(0, MAX_TRAIT_LENGTH)
    if (!label || has(label)) {
      setInput('')
      return
    }
    onChange([...traits, label])
    setInput('')
  }

  const chosen = traits.filter((t) => traitKey(t) !== traitKey(CUDDLY_TRAIT))
  const free = suggestions.filter((s) => !has(s) && traitKey(s) !== traitKey(CUDDLY_TRAIT))
  const cuddly = has(CUDDLY_TRAIT)

  return (
    <div className="trait-picker">
      <button
        type="button"
        className={cuddly ? 'trait-toggle trait-toggle--on' : 'trait-toggle'}
        style={{ '--trait-color': traitColor(CUDDLY_TRAIT) } as React.CSSProperties}
        aria-pressed={cuddly}
        onClick={() => toggle(CUDDLY_TRAIT)}
      >
        <span aria-hidden="true">🤲</span>
        {CUDDLY_TRAIT}
      </button>

      {chosen.length > 0 && (
        <div className="trait-chips">
          {chosen.map((t) => (
            <button
              key={traitKey(t)}
              type="button"
              className="trait-chip trait-chip--on"
              style={{ '--trait-color': traitColor(t) } as React.CSSProperties}
              onClick={() => toggle(t)}
              aria-label={`Retirer « ${traitLabel(t)} »`}
            >
              {traitLabel(t)}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}

      <div className="trait-add">
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          // Entrée valide le trait sans envoyer le formulaire entier.
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder="Nouvelle caractéristique…"
          maxLength={MAX_TRAIT_LENGTH}
          aria-label="Nouvelle caractéristique"
        />
        <button type="button" className="btn btn--outline" onClick={add} disabled={!input.trim()}>
          ➕ Ajouter
        </button>
      </div>

      {free.length > 0 && (
        <div className="trait-chips trait-chips--suggestions">
          {free.map((t) => (
            <button
              key={traitKey(t)}
              type="button"
              className="trait-chip"
              onClick={() => toggle(t)}
            >
              {traitLabel(t)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
