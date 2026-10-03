import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'cleanup-msw-worker',
      closeBundle() {
        const mswDist = path.resolve(__dirname, 'dist/mockServiceWorker.js');
        if (fs.existsSync(mswDist)) {
          fs.unlinkSync(mswDist);
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query', 'zustand', 'axios'],
          recharts: ['recharts'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
