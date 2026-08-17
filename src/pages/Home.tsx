import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { filterCats, useCats } from '../context/CatsContext'
import { CatCard } from '../components/CatCard'
import { Alert, EmptyState, Loading } from '../components/States'

export function Home({ search }: { search: string }) {
  const { cats, loading, error } = useCats()
  const navigate = useNavigate()
  const results = useMemo(() => filterCats(cats, search), [cats, search])

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
            message={`Rien ne correspond à « ${search} ». Essaie un autre nom ou une autre rue.`}
          />
        </div>
      ) : (
        <div className="grid">
          {results.map((cat) => (
            <CatCard key={cat.id} cat={cat} />
          ))}
        </div>
      )}
    </>
  )
}
