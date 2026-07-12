import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    cors: true,
    headers: {
      "Access-Control-Allow-Origin": "*"
    },
    proxy: {
      '^/(api|login|assets|files)': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    },
    watch: {
      usePolling: true,
      ignored: ['**/node_modules/**', '**/.git/**', '**/env/**', '**/dist/**']
    }
  },
  build: {
    outDir: resolve(__dirname, '../transitops/public/frontend'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, './index.html'),
      output: {
        entryFileNames: 'index.js',
        assetFileNames: 'index.css',
        chunkFileNames: '[name].js'
      }
    }
  }
})
