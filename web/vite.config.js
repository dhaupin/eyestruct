import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { rrdomEsmRedirect } from './scripts/rrdom-esm-redirect.mjs'

// The redirect plugin exists for the prestruct prerender pass. The engine loads
// StaticRouter OUTSIDE Vite's SSR module registry (plain dynamic import), while
// the app layout loads INSIDE it; react-router 7's real ESM means those are two
// module instances with two React contexts unless the registry copy delegates to
// the same Node ESM file URL. scripts/rrdom-esm-redirect.mjs does exactly that
// (see its header for the full seam + why). Client build is untouched.
export default defineConfig({
  ssr: { noExternal: ['react-router-dom', 'react-router'] },
  plugins: [rrdomEsmRedirect(), react()],
  build: {
    outDir: 'dist',
    // Performance optimizations
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Separate vendor chunk for better caching
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  // Hint to browsers about preloaded resources
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
