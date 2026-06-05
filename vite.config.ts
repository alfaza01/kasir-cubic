import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['logo_icon.png', 'icons.svg'],
      manifest: {
        name: 'AplikasiCubic',
        short_name: 'AplikasiCubic',
        description: 'AplikasiCubic',
        theme_color: '#005daa',
        orientation: 'any',
        icons: [
          {
            src: 'logo_icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo_icon.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'logo_icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
})
