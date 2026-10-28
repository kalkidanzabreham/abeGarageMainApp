import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // JSX transform. Removed in 18932cc, which left the app blank:
  // JSX compiled to React.createElement and main.jsx has no React import.
  plugins: [react()],
  base: "./", // Ensure relative paths
  build: {
    outDir: "dist",
  },
});

