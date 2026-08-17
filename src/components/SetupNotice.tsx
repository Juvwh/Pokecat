import { Logo } from './Logo'

/** Écran affiché tant que le fichier .env.local n'est pas rempli. */
export function SetupNotice() {
  return (
    <div className="login">
      <div className="login__card">
        <Logo className="login__logo" />
        <h1 className="login__title">Pokécat</h1>
        <p className="login__tagline">Configuration Firebase manquante</p>
        <div className="setup-text">
          <p>
            Crée un fichier <code>.env.local</code> à la racine du projet (une copie de{' '}
            <code>.env.example</code>) avec les clés de ton projet Firebase, puis relance{' '}
            <code>npm run dev</code>.
          </p>
          <p>
            Toutes les étapes sont détaillées dans <strong>explications.md</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
