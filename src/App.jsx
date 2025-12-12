import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext.jsx'
import Login from './pages/Login'
import DailyBrief from './pages/DailyBrief'
import AccountInbox from './pages/AccountInbox'
import Inbox from './pages/Inbox'
import Settings from './pages/Settings'
import './App.css'

/**
 * Protected Route Component
 * Redirects to /login if user is not authenticated
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, checkAuth } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  return children
}

/**
 * OAuth Callback Handler for Google Login
 */
function GoogleLoginCallback() {
  const { checkAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleCallback = async () => {
      // Check for error in URL params
      const params = new URLSearchParams(location.search)
      const error = params.get('error')
      
      if (error) {
        console.error('[OAuth Callback] Error:', error)
        navigate('/login?error=' + encodeURIComponent(error), { replace: true })
        return
      }

      // Debug: Check if cookies are present
      console.log('[OAuth Callback] All cookies:', document.cookie)
      console.log('[OAuth Callback] Current URL:', window.location.href)
      console.log('[OAuth Callback] Hash:', window.location.hash)
      console.log('[OAuth Callback] Search:', window.location.search)
      
      // The backend redirects here after setting cookies on its domain
      // Due to cross-origin restrictions, cookies from momoinbox.mooo.com
      // may not be accessible to localhost:5173
      // Try to verify auth - if it fails, cookies aren't accessible
      
      // Give the browser a moment to process any cookies
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Backend has already set cookies, verify auth
      try {
        await checkAuth()
        // Redirect to home after successful auth
        navigate('/', { replace: true })
      } catch (error) {
        console.error('[OAuth Callback] Auth check failed:', error)
        console.error('[OAuth Callback] Cookies after failure:', document.cookie)
        console.error('[OAuth Callback] This is likely a cross-origin cookie issue.')
        console.error('[OAuth Callback] Cookies set on momoinbox.mooo.com cannot be accessed by localhost:5173')
        console.error('[OAuth Callback] Please check browser DevTools -> Application -> Cookies for momoinbox.mooo.com')
        navigate('/login?error=cookie_access_failed', { replace: true })
      }
    }

    handleCallback()
  }, [checkAuth, navigate, location])

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '1.2rem'
    }}>
      Completing login...
    </div>
  )
}

/**
 * OAuth Callback Handler for Gmail Connection
 */
function GmailCallback() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleCallback = () => {
      // Check for error in URL params
      const params = new URLSearchParams(location.search)
      const error = params.get('error')
      
      if (error) {
        console.error('[Gmail Callback] Error:', error)
        navigate('/settings?error=' + encodeURIComponent(error), { replace: true })
        return
      }

      // Backend has already created the connection
      // Redirect to home page after successful connection
      navigate('/', { replace: true })
    }

    handleCallback()
  }, [navigate, location])

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '1.2rem'
    }}>
      Completing Gmail connection...
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/oauth/callback/google/login" element={<GoogleLoginCallback />} />
      <Route path="/oauth/callback/google/gmail" element={<GmailCallback />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <DailyBrief />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/daily-brief" 
        element={
          <ProtectedRoute>
            <DailyBrief />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/inbox" 
        element={
          <ProtectedRoute>
            <Inbox />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/account/:accountId" 
        element={
          <ProtectedRoute>
            <AccountInbox />
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}

export default App

