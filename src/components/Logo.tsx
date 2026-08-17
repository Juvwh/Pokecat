import logoUrl from './logo.png'

/**
 * Logo principal de l'application (Pokéball rose/bleue avec le chat).
 * Source unique : `src/components/logo.png`.
 * Pour changer le logo, remplace ce fichier — et `public/logo.png`, qui sert
 * d'icône d'onglet et d'icône PWA (voir index.html et manifest.webmanifest).
 */
export function Logo({ className, size }: { className?: string; size?: number }) {
  return (
    <img
      className={className}
      src={logoUrl}
      alt="Pokécat"
      width={size}
      height={size}
      draggable={false}
    />
  )
}
