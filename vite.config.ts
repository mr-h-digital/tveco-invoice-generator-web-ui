import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const basePath = '/tveco-invoice-generator-web-ui/'

export default defineConfig({
  // Repo name as base path for GitHub Pages
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'android-icon-192.png',
        'android-icon-512.png',
      ],
      manifest: {
        name: 'TVECO Invoice Generator',
        short_name: 'TVECO Invoices',
        description: 'Create and manage branded TVECO invoices and quotes.',
        theme_color: '#FF6B00',
        background_color: '#0A0C0F',
        display: 'standalone',
        orientation: 'portrait',
        scope: basePath,
        start_url: `${basePath}#/`,
        icons: [
          {
            src: 'android-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'android-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'android-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: `${basePath}index.html`,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
})
