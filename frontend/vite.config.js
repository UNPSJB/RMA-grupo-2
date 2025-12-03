//vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills() 
  ],
  resolve: {
    util: 'util/', 
    alias: {
    },
  },
  server: {
    open: false,
    cors: true
  }
});

