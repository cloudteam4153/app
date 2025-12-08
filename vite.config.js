import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Helper function to rewrite redirect Location headers
function rewriteRedirectLocation(proxyRes, req) {
  if (proxyRes.headers.location) {
    const location = proxyRes.headers.location;
    // If redirect points to backend URL, rewrite to relative path
    if (location.includes('35.188.76.100:8000')) {
      const relativePath = location.replace(/^https?:\/\/35\.188\.76\.100:8000/, '');
      proxyRes.headers.location = relativePath;
      console.log('Rewrote redirect:', location, '->', relativePath);
    }
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy all API requests to the backend service
      // This avoids CORS issues in development
      '/api': {
        target: 'http://35.188.76.100:8000',
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
      // Proxy integrations service endpoints (direct paths)
      '/connections': {
        target: 'http://35.188.76.100:8000',
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
      '/messages': {
        target: 'http://35.188.76.100:8000',
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
      '/syncs': {
        target: 'http://35.188.76.100:8000',
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
      '/health': {
        target: 'http://35.188.76.100:8000',
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

