import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

declare const process: { env: Record<string, string | undefined> }
const pagesBasePath = process.env.PAGES_BASE_PATH || './'

export default defineConfig({
  plugins: [react()],
  // GitHub Actions sets this to /<repository>/ for project sites.
  // For a user site or custom domain, set PAGES_BASE_PATH=/.
  base: pagesBasePath,
})
