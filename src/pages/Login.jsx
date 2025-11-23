import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (!email || !password) {
      setMessage({ type: 'error', text: 'Please enter both email and password' })
      return
    }

    // Simple mock login
    setTimeout(() => {
      setMessage({ type: 'success', text: 'Login successful! Redirecting...' })
      setTimeout(() => {
        navigate('/')
      }, 1000)
    }, 500)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Unified Inbox Assistant</h1>
        <p className="login-subtitle">Sign in to access your inbox</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="form-input"
            />
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button type="submit" className="login-button">
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login

