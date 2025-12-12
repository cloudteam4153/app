import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api.js'
import '../styles/Login.css'

function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLoginWithGoogle = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Pass the frontend callback URL so backend knows where to redirect after OAuth
      const frontendCallbackUrl = `${window.location.origin}/#/oauth/callback/google/login`
      const response = await authAPI.loginWithGoogle(frontendCallbackUrl)
      
      if (response && response.auth_url) {
        // Redirect to Google OAuth
        window.location.href = response.auth_url
      } else {
        throw new Error('No auth URL received from server')
      }
    } catch (error) {
      console.error('Failed to initiate Google login:', error)
      let errorMessage = error.message || 'Failed to start login process. Please try again.'
      
      // Provide more helpful error message for redirect URI issues
      if (errorMessage.includes('Redirect URI not allowed')) {
        errorMessage = 'Backend configuration error: The OAuth redirect URI is not configured. Please contact the administrator to add the callback URI to GOOGLE_REDIRECT_URIS.'
      }
      
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Unified Inbox Assistant</h1>
        <p className="login-subtitle">Sign in to access your unified inbox</p>
        
        <div className="login-info">

          <p>
            Sign in with Google to get started.
          </p>
        </div>

        {error && (
          <div className="login-error" style={{ 
            color: '#d32f2f', 
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor: '#ffebee',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <div className="login-actions">
          <button 
            type="button" 
            className="login-button primary"
            onClick={handleLoginWithGoogle}
            disabled={loading}
          >
            {loading ? 'Redirecting...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login

