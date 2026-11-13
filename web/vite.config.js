import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // The consumer-side rrdom shim is retired (eyestruct#14): prestruct's engine
  // closes the react-router 7 seam itself. The engine's externalized default
  // still splits the router into two module instances on this host
  // (useLocation() outside a <Router>); keeping the router in the SSR registry
  // via noExternal is what makes the single instance hold here.
  ssr: { noExternal: ['react-router-dom', 'react-router'] },
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Performance optimizations
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Separate vendor chunk for better caching. vite 8 is rolldown-based:
        // manualChunks must be a FUNCTION (the object form vite <=7 accepted is
        // rejected), and minify defaults to oxc (esbuild is unbundled).
        manualChunks(id) {
          if (id.replace(/\\/g, '/').includes('node_modules/react')) return 'vendor'
        },
      },
    },
  },
  // Hint to browsers about preloaded resources
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
