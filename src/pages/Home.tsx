import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { filterCats, useCats } from '../context/CatsContext'
import { CatCard } from '../components/CatCard'
import { Alert, EmptyState, Loading } from '../components/States'

const FIRST_NUMBER = 1

export function Home({ search }: { search: string }) {
  const { cats, loading, error } = useCats()
  const navigate = useNavigate()
  // Le chat n°001 reste épinglé en tête du catalogue : c'est le premier de
  // l'histoire du dex. Le tri est stable, les autres gardent leur ordre.
  const results = useMemo(
    () =>
      [...filterCats(cats, search)].sort(
        (a, b) => Number(b.number === FIRST_NUMBER) - Number(a.number === FIRST_NUMBER),
      ),
    [cats, search],
  )

  if (loading) return <Loading />
  if (error) return <Alert>{error}</Alert>

  if (cats.length === 0) {
    return (
      <div className="panel">
        <EmptyState
          emoji="🐾"
          title="Pokédex vide"
          message="Aucun chat enregistré pour l'instant. Le premier que vous croisez, ajoutez-le !"
        >
          <div className="btn-row">
            <button className="btn btn--primary" onClick={() => navigate('/nouveau')}>
              ➕ Enregistrer un chat
            </button>
          </div>
        </EmptyState>
      </div>
    )
  }

  return (
    <>
      <div className="counter">
        <span>Chats rencontrés</span>
        <strong>
          {search ? `${results.length} / ${cats.length}` : cats.length}
        </strong>
      </div>

      {results.length === 0 ? (
        <div className="panel">
          <EmptyState
            emoji="🔍"
            title="Aucun résultat"
            message={`Rien ne correspond à « ${search} ». Essaie un autre nom ou un autre trait de caractère.`}
          />
        </div>
      ) : (
        <div className="grid">
          {results.map((cat) => (
            <CatCard key={cat.id} cat={cat} featured={cat.number === FIRST_NUMBER} />
          ))}
        </div>
      )}
    </>
  )
}
