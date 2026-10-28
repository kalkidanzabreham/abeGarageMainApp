import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // JSX transform. Removed in 18932cc, which left the app blank:
  // JSX compiled to React.createElement and main.jsx has no React import.
  plugins: [react()],
  // Absolute asset URLs. "./" made them relative to the current page, so a
  // reload on a nested route (/admin/orders) requested
  // /admin/assets/index-*.js, got 404 and rendered nothing.
  base: "/",
  build: {
    outDir: "dist",
  },
});

