import { useState } from 'react'
import type { Sighting } from '../types'
import { formatDateTime, formatRelative, fromDateInput, toDateInput } from '../lib/time'

interface Props {
  sightings: Sighting[]
  busy: boolean
  onAdd: (at: number, note: string) => Promise<void>
  onDelete: (sighting: Sighting) => Promise<void>
}

/**
 * Historique des rencontres d'un chat : bouton « je l'ai recroisé »,
 * puis la liste antéchronologique de toutes les fois où on l'a vu.
 */
export function SightingHistory({ sightings, busy, onAdd, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(() => toDateInput(Date.now()))
  const [note, setNote] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await onAdd(fromDateInput(date), note.trim())
    setNote('')
    setDate(toDateInput(Date.now()))
    setOpen(false)
  }

  return (
    <section className="history">
      <div className="history__head">
        <h3 className="history__title">
          Rencontres
          <span className="history__count">{sightings.length}</span>
        </h3>
        {!open && (
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => setOpen(true)}
            disabled={busy}
          >
            👋 Je l'ai recroisé
          </button>
        )}
      </div>

      {open && (
        // `onSubmit` d'un formulaire imbriqué n'existe pas ici : la fiche n'est
        // pas un <form>, donc ce formulaire est autonome.
        <form className="history__form" onSubmit={submit}>
          <div className="field">
            <label className="field__label" htmlFor="sighting-date">Date de la rencontre</label>
            <input
              id="sighting-date"
              className="input"
              type="date"
              value={date}
              max={toDateInput(Date.now())}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="sighting-note">Note (facultatif)</label>
            <input
              id="sighting-note"
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Il dormait sur la voiture rouge…"
              maxLength={200}
            />
          </div>
          <div className="btn-row">
            <button className="btn btn--primary" type="submit" disabled={busy}>
              {busy ? 'Envoi…' : '✅ Enregistrer'}
            </button>
            <button
              className="btn btn--outline"
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <ol className="timeline">
        {sightings.map((s, i) => (
          <li className="timeline__item" key={s.id}>
            <span className="timeline__dot" aria-hidden="true" />
            <div className="timeline__body">
              <div className="timeline__row">
                <span className="timeline__when">{formatRelative(s.at)}</span>
                {/* La dernière ligne de la liste est la plus ancienne rencontre. */}
                {i === sightings.length - 1 && sightings.length > 1 && (
                  <span className="timeline__tag">1ʳᵉ fois</span>
                )}
                {sightings.length > 1 && (
                  <button
                    type="button"
                    className="timeline__delete"
                    onClick={() => onDelete(s)}
                    disabled={busy}
                    aria-label="Supprimer cette rencontre"
                    title="Supprimer cette rencontre"
                  >
                    ×
                  </button>
                )}
              </div>
              <span className="timeline__date">{formatDateTime(s.at)}</span>
              {s.note && <p className="timeline__note">{s.note}</p>}
              {s.byEmail && <span className="timeline__by">par {s.byEmail}</span>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
