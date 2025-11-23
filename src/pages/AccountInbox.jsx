import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../styles/AccountInbox.css'
import '../App.css'

function AccountInbox() {
  const { accountId } = useParams()
  const navigate = useNavigate()
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [chatInput, setChatInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Mock connected accounts - same as Daily Brief
  const connectedAccounts = [
    { id: 'all', name: 'All Accounts', type: 'all', icon: '📋' },
    { id: 'gmail1', name: 'work@gmail.com', type: 'gmail', icon: '📧' },
    { id: 'gmail2', name: 'personal@gmail.com', type: 'gmail', icon: '📧' },
    { id: 'gmail3', name: 'team@gmail.com', type: 'gmail', icon: '📧' },
    { id: 'slack1', name: 'Work Team', type: 'slack', icon: '💬' }
  ]

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

  // Mock messages - in real app, this would come from API based on accountId
  const messages = [
    {
      id: 1,
      from: 'john.doe@example.com',
      subject: 'Meeting Tomorrow at 2 PM',
      preview: 'Hi, just confirming our meeting tomorrow at 2 PM. Looking forward to discussing the project...',
      date: 'Yesterday',
      unread: true,
      type: 'email'
    },
    {
      id: 2,
      from: 'sarah.smith@example.com',
      subject: 'Project Update Required',
      preview: 'Could you please provide an update on the current project status? We need this by end of week...',
      date: 'Yesterday',
      unread: true,
      type: 'email'
    },
    {
      id: 3,
      from: '#general',
      subject: 'Team Standup Reminder',
      preview: 'Reminder: Weekly standup meeting is scheduled for Friday at 10 AM...',
      date: 'Mon',
      unread: false,
      type: 'slack'
    }
  ]

  const handleMessageClick = (message) => {
    setSelectedMessage(message)
  }

  const handleChatSubmit = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    
    // In real app, this would send to LLM API
    console.log('Chat input:', chatInput)
    setChatInput('')
  }

  const accountName = accountId === 'all' 
    ? 'All Accounts' 
    : `Account ${accountId}`

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
                className={`account-item ${accountId === account.id ? 'active' : ''}`}
                onClick={() => {
                  if (account.id === 'all') {
                    navigate('/')
                  } else {
                    navigate(`/account/${account.id}`)
                  }
                }}
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
        <div className="account-inbox-container">
        <div className="inbox-left-panel">
        <div className="inbox-header-panel">
          <div className="inbox-tabs">
            <button className="tab active">Inbox</button>
            <button className="tab">Unread</button>
            <button className="tab">Todo</button>
            <button className="tab">Follow-up</button>
          </div>
          <div className="inbox-search">
            <div className="search-bar">
              <span className="search-label">Q Filtered by:</span>
              <span className="filter-tag">search calendar meetings</span>
              <button className="clear-btn">Clear all</button>
            </div>
          </div>
        </div>
        <div className="messages-list">
          {messages.map(message => (
            <div
              key={message.id}
              className={`message-item ${selectedMessage?.id === message.id ? 'selected' : ''} ${message.unread ? 'unread' : ''}`}
              onClick={() => handleMessageClick(message)}
            >
              <div className="message-avatar">
                {message.from.charAt(0).toUpperCase()}
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="message-from">{message.from}</span>
                  <span className="message-date">{message.date}</span>
                </div>
                <div className="message-subject">{message.subject}</div>
                <div className="message-preview">{message.preview}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="inbox-center-panel">
        {selectedMessage ? (
          <div className="message-detail">
            <div className="message-detail-header">
              <h2>{selectedMessage.subject}</h2>
              <div className="message-actions">
                <button className="action-btn">← Reply</button>
                <button className="action-btn">→ Forward</button>
              </div>
            </div>
            <div className="message-detail-content">
              <div className="message-meta">
                <p><strong>From:</strong> {selectedMessage.from}</p>
                <p><strong>Date:</strong> {selectedMessage.date}</p>
                <p><strong>Type:</strong> {selectedMessage.type}</p>
              </div>
              <div className="message-body">
                <p>{selectedMessage.preview}</p>
                <p>This is the full email content. In a real application, this would be fetched from the email service and display the complete conversation thread.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-message-selected">
            <p>Select a message to view</p>
          </div>
        )}
      </div>

      <div className="inbox-right-panel">
        <div className="chat-header">
          <h3>Talk to Assistant</h3>
        </div>
        <div className="chat-suggestions">
          <p className="chat-hint">Chat about your inbox. Try: "search calendar meetings" or "show unread"</p>
          <div className="suggestion-buttons">
            <button className="suggestion-btn">Search calendar meetings</button>
            <button className="suggestion-btn">Set calendar meetings as todo</button>
            <button className="suggestion-btn">Find urgent emails</button>
            <button className="suggestion-btn">Show unread</button>
          </div>
        </div>
        <div className="chat-input-area">
          <form onSubmit={handleChatSubmit} className="chat-form">
            <input
              type="text"
              className="chat-input"
              placeholder="@ Add Context"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <div className="chat-footer">
              <select className="model-selector">
                <option>claude-4.5-sonnet</option>
              </select>
              <button type="submit" className="chat-send-btn">↑</button>
            </div>
          </form>
        </div>
      </div>
      </div>
      </div>
    </div>
  )
}

export default AccountInbox

