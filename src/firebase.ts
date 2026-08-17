import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

/**
 * La configuration vient des variables d'environnement (fichier .env.local).
 * Voir explications.md, étape 4.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** Vrai tant que le fichier .env.local n'a pas été rempli : on affiche alors un écran d'aide. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
)

const app = initializeApp(
  isFirebaseConfigured
    ? firebaseConfig
    // Valeurs bidons pour que l'app démarre quand même et affiche l'écran d'aide.
    : { apiKey: 'missing', projectId: 'missing', appId: 'missing' },
)

export const auth = getAuth(app)
export const db = getFirestore(app)
