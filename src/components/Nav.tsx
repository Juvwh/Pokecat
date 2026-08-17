import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/', label: 'Dex', emoji: '📕' },
  { to: '/nouveau', label: 'Ajouter', emoji: '➕' },
  { to: '/carte', label: 'Carte', emoji: '🗺️' },
]

export function Nav() {
  return (
    <nav className="nav">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => (isActive ? 'nav__item nav__item--active' : 'nav__item')}
        >
          <span aria-hidden="true">{item.emoji}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
