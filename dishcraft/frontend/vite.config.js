import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const certsDir = resolve(__dirname, 'certs')

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    open: { browser: 'chrome' },
    allowedHosts: 'all',
    https: {
      key:  readFileSync(resolve(certsDir, 'localhost+1-key.pem')),
      cert: readFileSync(resolve(certsDir, 'localhost+1.pem')),
    },
    proxy: {
      '/dishcraft-api': {
        target: 'http://localhost',
        changeOrigin: false,
      },
      '/qrious360-backend': {
        target: 'http://localhost',
        changeOrigin: false,
      },
    },
  },
})
