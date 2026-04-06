import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy /pollinations/* → https://image.pollinations.ai/*
      // This eliminates CORS entirely — request goes through Node.js server
      '/pollinations': {
        target: 'https://image.pollinations.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pollinations/, ''),
      },
    },
  },
})
