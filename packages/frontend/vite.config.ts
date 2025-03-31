import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // Import path module

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Setup path alias
    },
  },
  server: {
    port: 3000, // Puerto para el servidor de desarrollo del frontend
    proxy: {
      // Redirigir solicitudes /api al backend en el puerto 5000
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // Opcional: reescribir la ruta si es necesario
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
})