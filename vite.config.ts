import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'animation-vendor': ['framer-motion'],
          'icons-vendor': ['lucide-react'],
          'supabase-vendor': ['@supabase/supabase-js'],
        }
      }
    },
    chunkSizeWarningLimit: 600,
  }
});
