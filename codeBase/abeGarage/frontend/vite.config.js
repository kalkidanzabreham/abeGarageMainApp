import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // VITE_API_URL is compiled into the bundle. Without it a build "succeeds"
  // but every API call goes to "undefined/..." (seen on the first Vercel
  // deploy), so a build without it stops here with a clear message.
  // loadEnv reads .env files and VITE_* variables from the environment.
  if (command === "build" && !loadEnv(mode, process.cwd(), "VITE_").VITE_API_URL) {
    throw new Error(
      "VITE_API_URL is not set. Set it before building, e.g. VITE_API_URL=https://<api-host>/api (see docs/DEPLOY.md)."
    );
  }

  return {
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
  };
});
