import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    proxy: {
      '/api': {
        target: 'https://medcare-cqrs-clinical-api.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  },
})
