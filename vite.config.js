import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    strictPort: true, // Fail if port is in use so we don't silently switch to 5174 and break electron-dev
  },
  build: {
    outDir: 'build'
  }
})