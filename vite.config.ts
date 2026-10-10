import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    proxy: {
      '/api': {
        target: 'https://vfnpp611-7044.brs.devtunnels.ms',
        changeOrigin: true,
        secure: false,
      }
    }
  },
})
