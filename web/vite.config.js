import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // The consumer-side rrdom shim is retired (eyestruct#14): prestruct 1.2.0's
  // engine closes the react-router 7 seam itself. On this vite ^5.4.0 pin the
  // engine's externalized default still splits the router into two module
  // instances (useLocation() outside a <Router>); keeping the router in the
  // SSR registry via noExternal is what makes the single instance hold here.
  ssr: { noExternal: ['react-router-dom', 'react-router'] },
  plugins: [react()],
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
