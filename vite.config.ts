import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['mascot.png'],
      manifest: {
        name: 'Santa Blanca News',
        short_name: 'SB News',
        description: 'Die offizielle Zeitung der Santa Blanca Gruppe',
        theme_color: '#f4f1ea',
        background_color: '#f4f1ea',
        display: 'standalone',
        icons: [
          {
            src: 'mascot.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'mascot.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  base: '/santa-blanca-news/', // Wichtig für GitHub Pages!
})
