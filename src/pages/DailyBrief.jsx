import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'

function DailyBrief() {
  const [expandedSections, setExpandedSections] = useState({
    overdue: true,
    todo: true,
    followup: true
  })
  const [isConnected, setIsConnected] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [selectedAccount, setSelectedAccount] = useState('all')
  const navigate = useNavigate()

  // Mock connected accounts - in real app, this would come from API
  const connectedAccounts = [
    { id: 'all', name: 'All Accounts', type: 'all', icon: '📋' },
    { id: 'gmail1', name: 'work@gmail.com', type: 'gmail', icon: '📧' },
    { id: 'gmail2', name: 'personal@gmail.com', type: 'gmail', icon: '📧' },
    { id: 'gmail3', name: 'team@gmail.com', type: 'gmail', icon: '📧' },
    { id: 'slack1', name: 'Work Team', type: 'slack', icon: '💬' }
  ]

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleConnect = () => {
    navigate('/login')
  }

  const handleFetchNewEmails = () => {
    if (!isConnected) {
      setMessage({ type: 'error', text: 'Please connect to email first' })
      setTimeout(() => setMessage({ type: '', text: '' }), 2000)
      return
    }
    setMessage({ type: 'success', text: 'Fetching new emails and messages...' })
    setTimeout(() => {
      setMessage({ type: 'success', text: 'New emails and messages retrieved!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 2000)
    }, 1000)
  }

  const handleAddAccount = () => {
    navigate('/login')
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Unified Inbox Assistant</h1>
          <p className="subtitle">Gmail + Slack • Daily Brief • Task Management</p>
        </div>
        <div className="header-nav">
          <button className="nav-button" onClick={handleConnect}>
            {isConnected ? 'Connected' : 'Connect Email/Slack'}
          </button>
          <button className="nav-button" onClick={handleFetchNewEmails}>
            Fetch New Emails
          </button>
        </div>
      </header>
      {message.text && (
        <div className={`brief-message message ${message.type}`}>
          {message.text}
        </div>
      )}
      <div className="brief-layout">
        <aside className="brief-sidebar">
          <div className="sidebar-accounts">
            {connectedAccounts.map(account => (
              <button
                key={account.id}
                className={`account-item ${selectedAccount === account.id ? 'active' : ''}`}
                onClick={() => setSelectedAccount(account.id)}
                title={account.name}
              >
                <span className="account-icon">{account.icon}</span>
                <span className="account-name">{account.name}</span>
              </button>
            ))}
            <button className="account-item add-account-btn" onClick={handleAddAccount}>
              <span className="account-icon">+</span>
              <span className="account-name">Add Account</span>
            </button>
          </div>
          <div className="sidebar-footer">
            <button className="sidebar-help-btn" title="Help">
              <span className="help-icon">?</span>
            </button>
            <button className="sidebar-profile-btn" title="Profile">
              <span className="profile-icon">C</span>
            </button>
          </div>
        </aside>
        <main className="app-main">
          <div className="daily-brief">
            <div className="brief-header">
              <h2 className="brief-title">Daily Brief</h2>
              <p className="brief-date">
                {selectedAccount === 'all' 
                  ? `${dateStr} • Today • ${dayName} • All Accounts`
                  : `${dateStr} • Today • ${dayName} • ${connectedAccounts.find(a => a.id === selectedAccount)?.name}`
                }
              </p>
            </div>

          {/* Overdue Section */}
          <div className="task-section task-section-overdue">
            <div className="section-header" onClick={() => toggleSection('overdue')}>
              <span className="chevron">{expandedSections.overdue ? '▼' : '▶'}</span>
              <h3 className="section-title">Overdue</h3>
            </div>
            {expandedSections.overdue && (
              <div className="section-content">
                {/* Tasks will appear here */}
              </div>
            )}
          </div>

          {/* To do Section */}
          <div className="task-section task-section-todo">
            <div className="section-header" onClick={() => toggleSection('todo')}>
              <span className="chevron">{expandedSections.todo ? '▼' : '▶'}</span>
              <h3 className="section-title">To do</h3>
            </div>
            {expandedSections.todo && (
              <div className="section-content">
                {/* Tasks will appear here */}
              </div>
            )}
          </div>

          {/* Follow-up Section */}
          <div className="task-section task-section-followup">
            <div className="section-header" onClick={() => toggleSection('followup')}>
              <span className="chevron">{expandedSections.followup ? '▼' : '▶'}</span>
              <h3 className="section-title">Follow-up</h3>
            </div>
            {expandedSections.followup && (
              <div className="section-content">
                {/* Tasks will appear here */}
              </div>
            )}
          </div>
        </div>
        </main>
      </div>
    </div>
  )
}

export default DailyBrief

