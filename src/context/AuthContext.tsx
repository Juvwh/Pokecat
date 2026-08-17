import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth } from '../firebase'

/**
 * Pas de fonction d'inscription : les deux comptes sont créés à la main dans la
 * console Firebase et la création de compte y est désactivée. Voir explications.md.
 */
interface AuthValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

/** Traduit les codes d'erreur Firebase en messages lisibles. */
function humanError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return "Cette adresse email n'est pas valide."
    case 'auth/missing-password':
      return 'Il faut saisir un mot de passe.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email ou mot de passe incorrect.'
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Réessaie dans quelques minutes.'
    case 'auth/network-request-failed':
      return 'Pas de connexion au serveur. Vérifie ta connexion internet.'
    case 'auth/operation-not-allowed':
      return "La connexion par email n'est pas activée dans la console Firebase (voir explications.md, étape 3)."
    default:
      return `Erreur de connexion (${code}).`
  }
}

function wrap(promise: Promise<unknown>): Promise<void> {
  return promise.then(
    () => undefined,
    (err: { code?: string; message?: string }) => {
      throw new Error(humanError(err.code ?? err.message ?? 'inconnue'))
    },
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u)
        setLoading(false)
      }),
    [],
  )

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      login: (email, password) => wrap(signInWithEmailAndPassword(auth, email, password)),
      logout: () => wrap(signOut(auth)),
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un <AuthProvider>.')
  return ctx
}
