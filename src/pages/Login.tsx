import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/States'
import { Logo } from '../components/Logo'

/**
 * Connexion uniquement : il n'y a volontairement pas d'inscription.
 * Les deux comptes sont créés à la main dans la console Firebase
 * (Authentication → Users → Add user), et la création de compte est
 * désactivée côté Firebase. Voir explications.md, étape 3.
 */
export function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email, password)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <div className="login__card">
        <Logo className="login__logo" />
        <h1 className="login__title">Pokécat</h1>
        <p className="login__tagline">Caressons-les tous !</p>

        <form onSubmit={submit}>
          <div className="field">
            <label className="field__label" htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="password">Mot de passe</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <Alert>{error}</Alert>}

          <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
