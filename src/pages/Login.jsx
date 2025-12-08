import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Login.css'

function Login() {
  const navigate = useNavigate()

  const handleConnectAccounts = () => {
    navigate('/settings')
  }

  const handleGoToInbox = () => {
    navigate('/')
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Unified Inbox Assistant</h1>
        <p className="login-subtitle">Connect your email and messaging accounts</p>
        
        <div className="login-info">
          <p>
            This application uses OAuth to securely connect to your accounts. 
            No passwords are stored or required.
          </p>
          <p>
            To get started, connect your Gmail, Slack, or other messaging accounts 
            through the settings page.
          </p>
        </div>

        <div className="login-actions">
          <button 
            type="button" 
            className="login-button primary"
            onClick={handleConnectAccounts}
          >
            Connect Accounts
          </button>
          <button 
            type="button" 
            className="login-button secondary"
            onClick={handleGoToInbox}
          >
            Go to Inbox
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login

