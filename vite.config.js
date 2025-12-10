import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Helper function to rewrite redirect Location headers
function rewriteRedirectLocation(proxyRes, req) {
  if (proxyRes.headers.location) {
    const location = proxyRes.headers.location;
    // If redirect points to backend URL, rewrite to relative path
    if (location.includes('integrations-svc-ms2-ft4pa23xra-uc.a.run.app')) {
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
      // Proxy all API requests to the backend service
      // This avoids CORS issues in development
      '/api': {
        target: 'https://integrations-svc-ms2-ft4pa23xra-uc.a.run.app',
        changeOrigin: true,
        secure: true,
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
        target: 'https://integrations-svc-ms2-ft4pa23xra-uc.a.run.app',
        changeOrigin: true,
        secure: true,
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
        target: 'https://integrations-svc-ms2-ft4pa23xra-uc.a.run.app',
        changeOrigin: true,
        secure: true,
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
        target: 'https://integrations-svc-ms2-ft4pa23xra-uc.a.run.app',
        changeOrigin: true,
        secure: true,
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
        target: 'https://integrations-svc-ms2-ft4pa23xra-uc.a.run.app',
        changeOrigin: true,
        secure: true,
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

