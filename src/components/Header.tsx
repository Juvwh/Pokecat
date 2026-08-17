import { useAuth } from '../context/AuthContext'
import { Logo } from './Logo'

interface Props {
  search: string
  onSearch: (value: string) => void
  /** La recherche n'a de sens que sur le catalogue et la carte. */
  showSearch: boolean
}

export function Header({ search, onSearch, showSearch }: Props) {
  const { user, logout } = useAuth()

  return (
    <header className="header">
      <div className="header__top">
        <Logo className="header__logo" />
        <div className="brand">
          <h1 className="brand__title">Pokécat</h1>
          <p className="brand__subtitle">Caressons-les tous !</p>
        </div>
        <button
          className="icon-button"
          onClick={logout}
          title={`Déconnexion (${user?.email ?? ''})`}
          aria-label="Se déconnecter"
        >
          ⏻
        </button>
      </div>

      {showSearch && (
        <div className="search">
          <span className="search__icon" aria-hidden="true">🔍</span>
          <input
            className="search__input"
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Chercher un nom ou une adresse…"
            aria-label="Chercher un chat par nom ou adresse"
          />
          {search && (
            <button
              className="search__clear"
              onClick={() => onSearch('')}
              aria-label="Effacer la recherche"
            >
              ×
            </button>
          )}
        </div>
      )}
    </header>
  )
}
