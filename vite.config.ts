import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base: './'` => tous les chemins générés sont relatifs.
// Ça permet au build de fonctionner aussi bien à la racine d'un domaine que
// dans un sous-dossier GitHub Pages (https://<user>.github.io/<repo>/),
// sans avoir à coder le nom du dépôt en dur.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true, // permet d'ouvrir l'app depuis le téléphone sur le même wifi
    port: 5173,
  },
})
