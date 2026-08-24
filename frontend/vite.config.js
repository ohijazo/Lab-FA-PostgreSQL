import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // El projecte viu en una unitat de xarxa (SMB). El vigilant de fitxers
    // natiu hi peta amb ECONNRESET; el sondeig és més lent però estable.
    watch: { usePolling: true, interval: 400 },
    proxy: {
      '/api': {
        // Per defecte el backend local; es pot redirigir amb VITE_API_TARGET
        // (útil quan el 5000 està ocupat, i per a entorns de desplegament).
        target: process.env.VITE_API_TARGET || 'http://localhost:5000',
        changeOrigin: true,
        // No bufferar SSE (streaming) — imprescindible per /api/recepcio/stream
        selfHandleResponse: false,
      },
    },
  },
})
