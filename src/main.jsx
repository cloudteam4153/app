import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Use HashRouter instead of BrowserRouter because:
// 1. GCS storage.googleapis.com doesn't support notFoundPage for sub-routes
// 2. When you refresh on a route like /settings, GCS returns 404
// 3. HashRouter uses # in URLs (e.g., index.html#/settings) 
// 4. Browser only requests index.html, hash part is handled client-side
// 5. Refresh works on any route because browser never requests the route path
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)

