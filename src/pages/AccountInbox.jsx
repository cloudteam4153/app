import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../styles/AccountInbox.css'
import '../App.css'
import { integrationsAPI } from '../services/api.js'
import { TEST_USER_ID } from '../config/api.js'

function AccountInbox() {
  const { accountId } = useParams()
  const navigate = useNavigate()
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [chatInput, setChatInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [connectedAccounts, setConnectedAccounts] = useState([
    { id: 'all', name: 'All Accounts', type: 'all', icon: '📋' }
  ])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentConnection, setCurrentConnection] = useState(null)

  // Load connections and messages on mount
  useEffect(() => {
    loadConnections()
  }, [])

  useEffect(() => {
    if (accountId && accountId !== 'all') {
      loadMessagesForAccount(accountId)
    } else {
      loadAllMessages()
    }
  }, [accountId])

  const loadConnections = async () => {
    try {
      const response = await integrationsAPI.listConnections({ 
        is_active: true,
        limit: 100 
      })
      const connections = Array.isArray(response) ? response : (response.items || [])
      
      const accounts = [
        { id: 'all', name: 'All Accounts', type: 'all', icon: '📋' },
        ...connections.map(conn => ({
          id: conn.id,
          name: conn.provider_account_id || `${conn.provider} Account`,
          type: conn.provider?.toLowerCase() || 'unknown',
          icon: conn.provider?.toLowerCase() === 'gmail' ? '📧' : 
                conn.provider?.toLowerCase() === 'slack' ? '💬' : '📋',
          connection: conn
        }))
      ]
      
      setConnectedAccounts(accounts)
      setIsConnected(connections.length > 0)
      
      // Set current connection if accountId is specified
      if (accountId && accountId !== 'all') {
        const conn = connections.find(c => c.id === accountId)
        setCurrentConnection(conn)
      }
    } catch (error) {
      console.error('Failed to load connections:', error)
      let errorMessage = 'Failed to load connections'
      
      // Check for network errors
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        errorMessage = `Cannot connect to API server. Please ensure the composite service is running on http://35.239.94.117:8000. Error: ${error.message}`
      } else {
        errorMessage = `Failed to load connections: ${error.message || 'Unknown error'}`
      }
      
      setMessage({ 
        type: 'error', 
        text: errorMessage
      })
      setTimeout(() => setMessage({ type: '', text: '' }), 8000)
    }
  }

  const loadMessagesForAccount = async (connectionId) => {
    try {
      setLoading(true)
      
      // Fetch all messages and filter by connection_id on client side
      // (API may not support connection_id filter directly)
      const response = await integrationsAPI.listMessages({ 
        limit: 1000, // Get more to filter
        sort_by: 'created_at',
        sort_order: 'desc'
      })
      
      // Integrations service returns List[MessageRead] directly (array)
      const messagesList = Array.isArray(response) ? response : []
      
      // Note: Messages don't have connection_id field - they're user-scoped
      // All messages for the user will be returned, we can't filter by connection
      // This is a limitation of the current API design
      
      setMessages(messagesList.map(msg => {
        // Use internal_date if available (Unix timestamp in milliseconds), otherwise use created_at
        let dateStr = 'Unknown'
        if (msg.internal_date) {
          dateStr = new Date(msg.internal_date).toLocaleDateString()
        } else if (msg.created_at) {
          dateStr = new Date(msg.created_at).toLocaleDateString()
        }
        
        return {
          id: msg.id,
          from: 'Unknown Sender', // Would need to parse raw field for actual sender
          subject: msg.snippet ? msg.snippet.substring(0, 50) : '(No Subject)', // Use snippet as subject placeholder
          preview: msg.snippet || '', // Use snippet field from API
          date: dateStr,
          unread: false, // Messages don't have is_read field
          type: 'email', // Default type
          body: msg.raw || '', // Base64 encoded raw message
          snippet: msg.snippet || '',
          external_id: msg.external_id,
          internal_date: msg.internal_date
        }
      }))
    } catch (error) {
      console.error('Failed to load messages:', error)
      setMessage({ type: 'error', text: 'Failed to load messages' })
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    } finally {
      setLoading(false)
    }
  }

  const loadAllMessages = async () => {
    try {
      setLoading(true)
      
      const response = await integrationsAPI.listMessages({ 
        limit: 100,
        sort_by: 'created_at',
        sort_order: 'desc'
      })
      
      // Integrations service returns List[MessageRead] directly (array)
      const messagesList = Array.isArray(response) ? response : []
      setMessages(messagesList.map(msg => {
        // Use internal_date if available (Unix timestamp in milliseconds), otherwise use created_at
        let dateStr = 'Unknown'
        if (msg.internal_date) {
          dateStr = new Date(msg.internal_date).toLocaleDateString()
        } else if (msg.created_at) {
          dateStr = new Date(msg.created_at).toLocaleDateString()
        }
        
        return {
          id: msg.id,
          from: 'Unknown Sender', // Would need to parse raw field for actual sender
          subject: msg.snippet ? msg.snippet.substring(0, 50) : '(No Subject)', // Use snippet as subject placeholder
          preview: msg.snippet || '', // Use snippet field from API
          date: dateStr,
          unread: false, // Messages don't have is_read field
          type: 'email', // Default type
          body: msg.raw || '', // Base64 encoded raw message
          snippet: msg.snippet || '',
          external_id: msg.external_id,
          internal_date: msg.internal_date
        }
      }))
    } catch (error) {
      console.error('Failed to load messages:', error)
      setMessage({ type: 'error', text: 'Failed to load messages' })
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = () => {
    navigate('/settings')
  }

  const handleFetchNewEmails = async () => {
    if (!isConnected) {
      setMessage({ type: 'error', text: 'Please connect to email first' })
      setTimeout(() => setMessage({ type: '', text: '' }), 2000)
      return
    }

    try {
      setMessage({ type: 'info', text: 'Syncing new emails and messages...' })
      
      const connectionsToSync = currentConnection 
        ? [currentConnection] 
        : connectedAccounts.filter(acc => acc.id !== 'all' && acc.connection?.is_active)
          .map(acc => acc.connection)

      if (connectionsToSync.length === 0) {
        setMessage({ type: 'error', text: 'No active connections to sync' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
        return
      }

      // Create syncs for connections
      const syncPromises = connectionsToSync.map(conn => 
        integrationsAPI.createSync({
          connection_id: conn.id,
          user_id: TEST_USER_ID,
          sync_type: 'incremental'
        }).catch(error => {
          console.error(`Failed to sync connection ${conn.id}:`, error)
          return null
        })
      )

      await Promise.all(syncPromises)
      
      // Reload messages after sync (give sync time to complete)
      setTimeout(async () => {
        console.log('[AccountInbox] Reloading messages after sync...')
        if (accountId && accountId !== 'all') {
          await loadMessagesForAccount(accountId)
        } else {
          await loadAllMessages()
        }
        
        // Check if any messages were actually synced
        const messageCount = accountId && accountId !== 'all' 
          ? messages.filter(m => m.connection_id === accountId).length
          : messages.length
        
        if (messageCount === 0) {
          setMessage({ 
            type: 'warning', 
            text: 'Sync completed, but no messages found. Gmail API integration may not be fully implemented yet.' 
          })
        } else {
          setMessage({ type: 'success', text: `Sync completed! Found ${messageCount} message(s).` })
        }
        setTimeout(() => setMessage({ type: '', text: '' }), 5000)
      }, 3000) // Increased timeout to allow sync to complete
    } catch (error) {
      console.error('Failed to sync messages:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to sync messages' })
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    }
  }

  const handleAddAccount = () => {
    navigate('/settings')
  }

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
          {loading ? (
            <div className="loading-state">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <p>No messages found</p>
              <button className="btn-sync" onClick={handleFetchNewEmails}>
                Sync Messages
              </button>
            </div>
          ) : (
            messages.map(message => (
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
            ))
          )}
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
                {selectedMessage.body ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedMessage.body.replace(/\n/g, '<br>') }} />
                ) : (
                  <>
                    <p>{selectedMessage.preview}</p>
                    <p>Full message content not available. This may be a preview-only message.</p>
                  </>
                )}
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

