import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('@tanstack')) return 'vendor-tanstack';
            if (id.includes('react/') || id.includes('react-dom/')) return 'vendor-react';
            if (id.includes('lucide')) return 'vendor-icons';
            return 'vendor-core'; // Renamed to avoid overlap
          }
        }
      }
    }
  }
});
