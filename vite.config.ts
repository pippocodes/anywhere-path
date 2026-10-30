/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Anywhere Path',
        short_name: 'Anywhere',
        description: 'Turn the skills you want to learn into habits you actually keep.',
        start_url: '/',
        display: 'standalone',
        // The app's default theme (Carousel, dark) — see index.html's own
        // inline theme-color script and src/theme-tokens.json. A static
        // manifest can't follow the user's live theme choice, so this is
        // the same default the app already falls back to before React (and
        // the user's saved theme) ever mounts.
        theme_color: '#210100',
        background_color: '#210100',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache only the built app shell (JS/CSS/HTML/fonts/icons) —
        // never API calls or Supabase requests, which this list can't match
        // since they aren't build output files at all. No runtimeCaching
        // entries are added for the same reason: without one, every other
        // request (api/*, *.supabase.co) passes straight to the network,
        // untouched by the service worker, including auth/login responses.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        // Take over immediately on activation and check for a new service
        // worker on every page load, so a new deploy reaches the next visit
        // rather than waiting for every open tab to close first.
        clientsClaim: true,
        skipWaiting: true,
        // Adds push/notificationclick handling to the generated sw.js
        // without hand-writing (and so losing) Workbox's own precaching —
        // see public/push-sw.js.
        importScripts: ['push-sw.js'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
})
