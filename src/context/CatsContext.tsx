import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { subscribeToCats } from '../lib/cats'
import type { Cat } from '../types'
import { useAuth } from './AuthContext'

interface CatsValue {
  cats: Cat[]
  loading: boolean
  error: string | null
  /** Numéro de Pokédex à attribuer au prochain chat. */
  nextNumber: number
}

const CatsContext = createContext<CatsValue | null>(null)

export function CatsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [cats, setCats] = useState<Cat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setCats([])
      setLoading(false)
      return
    }
    setLoading(true)
    return subscribeToCats(
      (next) => {
        setCats(next)
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(
          err.message.includes('permission')
            ? "Accès refusé par Firestore. Vérifie les règles de sécurité (explications.md, étape 5)."
            : `Impossible de charger les chats : ${err.message}`,
        )
        setLoading(false)
      },
    )
  }, [user])

  const value = useMemo<CatsValue>(
    () => ({
      cats,
      loading,
      error,
      nextNumber: cats.reduce((max, c) => Math.max(max, c.number), 0) + 1,
    }),
    [cats, loading, error],
  )

  return <CatsContext.Provider value={value}>{children}</CatsContext.Provider>
}

export function useCats(): CatsValue {
  const ctx = useContext(CatsContext)
  if (!ctx) throw new Error('useCats doit être utilisé dans un <CatsProvider>.')
  return ctx
}

/** Recherche par nom ou par adresse, insensible à la casse et aux accents. */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
}

export function filterCats(cats: Cat[], search: string): Cat[] {
  const q = normalize(search)
  if (!q) return cats
  return cats.filter((cat) => {
    const haystack = normalize(`${cat.name} ${cat.address} ${cat.notes}`)
    // Chaque mot de la recherche doit être présent quelque part.
    return q.split(/\s+/).every((word) => haystack.includes(word))
  })
}
