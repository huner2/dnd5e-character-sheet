import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Project-site base path on GitHub Pages (e.g. `/dnd5e-character-sheet/`). */
const pagesBase =
  process.env.VITE_BASE_PATH ??
  (process.env.GITHUB_PAGES === 'true' ? '/dnd5e-character-sheet/' : '/')

// https://vite.dev/config/
export default defineConfig({
  base: pagesBase,
  plugins: [react()],
})
