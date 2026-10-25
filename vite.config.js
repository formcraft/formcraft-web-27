// Vite configuration. The manifest (dist/.vite/manifest.json) lists the files each page's code needs, so
// scripts/prerender.mjs can put a page's own stylesheets into its pre-built HTML (no unstyled first paint).
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: { manifest: true },
})
