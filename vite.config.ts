import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // define: { 'process.env': {} } // Removed to prevent blocking process.env.API_KEY access
})