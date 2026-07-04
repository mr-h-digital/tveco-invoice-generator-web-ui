import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Repo name as base path for GitHub Pages
  base: '/tveco-invoice-generator-web-ui/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
