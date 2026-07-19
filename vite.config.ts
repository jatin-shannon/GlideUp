import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'GlideUp — Learn ServiceNow Scripting',
        short_name: 'GlideUp',
        description:
          'A Duolingo-style, offline-first PWA that teaches ServiceNow scripting through short, gamified lessons.',
        theme_color: '#0ea5e9',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Bundle all app assets and content JSON for full offline use.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
      },
    }),
  ],
});
