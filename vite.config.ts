import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import fs from 'fs';
import path from 'path';

// Pre-create the server entry point to satisfy Cloudflare plugin validation
// This is necessary because the plugin checks for the file's existence 
// before the build process actually generates it.
const serverDir = path.resolve(process.cwd(), 'dist/server');
if (!fs.existsSync(serverDir)) {
  fs.mkdirSync(serverDir, { recursive: true });
}
const serverEntry = path.join(serverDir, 'index.js');
if (!fs.existsSync(serverEntry)) {
  fs.writeFileSync(serverEntry, '');
}

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
