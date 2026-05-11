import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nodeEnv = globalThis.process?.env ?? {};
const proxyTarget = nodeEnv.VITE_PROXY_TARGET || 'http://localhost';
const proxyRewritePrefix = nodeEnv.VITE_PROXY_REWRITE_PREFIX ?? '/rentease/backend';
const debugProxy = nodeEnv.VITE_DEBUG_PROXY === 'true';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    proxy: {
      '/backend': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
        rewrite: (requestPath) => requestPath.replace(/^\/backend/, proxyRewritePrefix),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            if (debugProxy) {
              console.log('Proxy error:', err);
            }
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            if (debugProxy) {
              console.log('Proxying:', req.method, req.url);
            }
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
