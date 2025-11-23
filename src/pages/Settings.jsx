import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Settings.css'

function Settings() {
  const [gmailConnected, setGmailConnected] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const navigate = useNavigate()

  const handleConnectGmail = () => {
    setMessage({ type: '', text: '' })
    setTimeout(() => {
      setGmailConnected(true)
      setMessage({ type: 'success', text: 'Gmail connected successfully!' })
    }, 1000)
  }

  const handleDisconnectGmail = () => {
    setGmailConnected(false)
    setMessage({ type: 'success', text: 'Gmail disconnected' })
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div className="settings-nav">
          <button className="back-button" onClick={() => navigate('/daily-brief')}>
            ← Daily Brief
          </button>
          <button className="nav-button" onClick={() => navigate('/inbox')}>
            Inbox
          </button>
        </div>
        <h1>Settings</h1>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h2>Email Accounts</h2>
          <div className="account-card">
            <div className="account-info">
              <h3>Gmail</h3>
              <p className="account-status">
                {gmailConnected ? (
                  <span className="status-connected">● Connected</span>
                ) : (
                  <span className="status-disconnected">● Not Connected</span>
                )}
              </p>
            </div>
            {gmailConnected ? (
              <button className="btn-disconnect" onClick={handleDisconnectGmail}>
                Disconnect
              </button>
            ) : (
              <button className="btn-connect" onClick={handleConnectGmail}>
                Connect Gmail
              </button>
            )}
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings

