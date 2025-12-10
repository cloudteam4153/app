import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Helper function to rewrite redirect Location headers
function rewriteRedirectLocation(proxyRes, req) {
  if (proxyRes.headers.location) {
    const location = proxyRes.headers.location;
    // If redirect points to backend URL, rewrite to relative path
    if (location.includes('35.239.94.117:8000')) {
      // Extract the path from the full URL
      const url = new URL(location);
      const relativePath = url.pathname + url.search + url.hash;
      proxyRes.headers.location = relativePath;
      console.log('Rewrote redirect:', location, '->', relativePath);
    }
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy all API requests to the composite microservice
      // This avoids CORS issues in development
      '/api': {
        target: 'http://35.239.94.117:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying request:', req.method, req.url, '->', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            rewriteRedirectLocation(proxyRes, req);
          });
        },
      },
      // Proxy root health check endpoint
      '/health': {
        target: 'http://35.239.94.117:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying request:', req.method, req.url, '->', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            rewriteRedirectLocation(proxyRes, req);
          });
        },
      },
    },
  },
})

