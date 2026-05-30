import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** Project-site base path on GitHub Pages (e.g. `/dnd5e-character-sheet/`). */
const pagesBase =
  process.env.VITE_BASE_PATH ??
  (process.env.GITHUB_PAGES === 'true' ? '/dnd5e-character-sheet/' : '/')

const buildId = process.env.VITE_BUILD_ID ?? 'dev'

function appVersionFilePlugin(): Plugin {
  return {
    name: 'app-version-file',
    closeBundle() {
      const outDir = resolve(__dirname, 'dist')
      writeFileSync(
        resolve(outDir, 'version.json'),
        `${JSON.stringify({ buildId }, null, 2)}\n`,
        'utf8',
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: pagesBase,
  plugins: [react(), appVersionFilePlugin()],
  define: {
    'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildId),
  },
})
