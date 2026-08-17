import { useState } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { isFirebaseConfigured } from './firebase'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CatsProvider } from './context/CatsContext'
import { Header } from './components/Header'
import { Nav } from './components/Nav'
import { SetupNotice } from './components/SetupNotice'
import { Loading } from './components/States'
import { Home } from './pages/Home'
import { CatDetail } from './pages/CatDetail'
import { CatForm } from './pages/CatForm'
import { MapPage } from './pages/MapPage'
import { Login } from './pages/Login'

function Shell() {
  const [search, setSearch] = useState('')
  const { pathname } = useLocation()
  const showSearch = pathname === '/' || pathname === '/carte'

  return (
    <div className="app">
      <Header search={search} onSearch={setSearch} showSearch={showSearch} />
      <main className="app__body">
        <Routes>
          <Route path="/" element={<Home search={search} />} />
          <Route path="/carte" element={<MapPage search={search} />} />
          <Route path="/nouveau" element={<CatForm mode="create" />} />
          <Route path="/chat/:id" element={<CatDetail />} />
          <Route path="/chat/:id/modifier" element={<CatForm mode="edit" />} />
          <Route path="*" element={<Home search={search} />} />
        </Routes>
      </main>
      <Nav />
    </div>
  )
}

function Gate() {
  const { user, loading } = useAuth()
  if (loading) return <Loading label="Connexion au Pokédex…" />
  if (!user) return <Login />
  return (
    <CatsProvider>
      <Shell />
    </CatsProvider>
  )
}

export default function App() {
  if (!isFirebaseConfigured) return <SetupNotice />

  // HashRouter : GitHub Pages sert des fichiers statiques et ne sait pas
  // rediriger /carte vers index.html. Les URLs seront donc de la forme
  // https://…/Pokecat/#/carte — et le rafraîchissement fonctionne partout.
  return (
    <HashRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </HashRouter>
  )
}
