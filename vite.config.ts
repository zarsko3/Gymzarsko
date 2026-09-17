import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const manifest = JSON.parse(
  readFileSync(path.resolve(__dirname, 'public/manifest.json'), 'utf-8')
)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icon-192x192.png',
        'icon-512x512.png',
        'icon-180x180.png',
      ],
      manifest,
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Local QA screenshots are not part of the app
        globIgnores: ['screenshots/**'],
      },
    }),
  ],
  base: '/',
  server: {
    port: 3000,
    open: !process.env.PLAYWRIGHT && !process.env.CI,
  },
  build: {
    outDir: 'dist',
    // Don't publish source maps (they expose the original source)
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split large, rarely-changing libraries so app updates don't re-download them
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          charts: ['recharts'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})

