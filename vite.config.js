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
  base: '/unified-inbox-app-1765383702/', // Absolute base path for GCS hosting
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
            // Log request body for PATCH/POST requests
            if (req.method === 'PATCH' || req.method === 'POST' || req.method === 'PUT') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', () => {
                if (body) {
                  try {
                    const parsed = JSON.parse(body);
                    console.log('[Proxy] Request body:', JSON.stringify(parsed, null, 2));
                  } catch (e) {
                    console.log('[Proxy] Request body (raw):', body);
                  }
                }
              });
            }
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            rewriteRedirectLocation(proxyRes, req);
            // Log response status for debugging
            if (proxyRes.statusCode >= 400) {
              console.log(`[Proxy] Response: ${req.method} ${req.url} -> ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
            }
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

