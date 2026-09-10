import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      // Predictable, debuggable class names in dev; hashed in prod.
      generateScopedName: '[name]__[local]__[hash:base64:5]',
    },
  },
  server: {
    proxy: {
      // The brew-counter Worker. Run it separately with `npm run worker:dev`
      // (defaults to :8787); the client only ever calls the relative
      // /api/brews path, in dev and in production alike.
      '/api': 'http://localhost:8787',
    },
  },
})
