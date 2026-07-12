import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 7777,
    host: true,
    strictPort: true,
    allowedHosts: true,
    watch: {
      ignored: ['**']
    }
  }
})
