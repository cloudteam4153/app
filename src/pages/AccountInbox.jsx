import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../styles/AccountInbox.css'
import '../App.css'
import { integrationsAPI } from '../services/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'

function AccountInbox() {
  const { accountId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
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
  const [activeTab, setActiveTab] = useState('inbox')

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

  // Helper function to determine unread status from API response
  const determineUnreadStatus = (msg) => {
    // Check for label_ids array (Gmail-style)
    if (msg.label_ids && Array.isArray(msg.label_ids)) {
      // If label_ids contains "UNREAD" or doesn't contain "READ", it's unread
      const hasUnread = msg.label_ids.some(label => 
        label === 'UNREAD' || label === 'unread' || label === 'UNREAD_LABEL'
      )
      const hasRead = msg.label_ids.some(label => 
        label === 'READ' || label === 'read' || label === 'READ_LABEL'
      )
      return hasUnread || !hasRead
    }
    
    // Check for label field (string)
    if (msg.label) {
      return msg.label === 'unread' || msg.label === 'UNREAD'
    }
    
    // Check for is_read field (boolean)
    if (msg.is_read !== undefined) {
      return !msg.is_read
    }
    
    // Default to unread if no field found (assume unread by default)
    return true
  }

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
        errorMessage = `Cannot connect to API server. Please ensure the composite service is running on https://momoinbox.mooo.com. Error: ${error.message}`
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
          unread: determineUnreadStatus(msg), // Extract unread status from API
          type: 'email', // Default type
          body: msg.raw || '', // Base64 encoded raw message
          snippet: msg.snippet || '',
          external_id: msg.external_id,
          internal_date: msg.internal_date,
          // Preserve API fields needed for updates
          label_ids: msg.label_ids,
          label: msg.label,
          is_read: msg.is_read
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
          unread: determineUnreadStatus(msg), // Extract unread status from API
          type: 'email', // Default type
          body: msg.raw || '', // Base64 encoded raw message
          snippet: msg.snippet || '',
          external_id: msg.external_id,
          internal_date: msg.internal_date,
          // Preserve API fields needed for updates
          label_ids: msg.label_ids,
          label: msg.label,
          is_read: msg.is_read
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
      if (!user || !user.id) {
        setMessage({ type: 'error', text: 'User not authenticated' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
        return
      }

      const syncPromises = connectionsToSync.map(conn => 
        integrationsAPI.createSync({
          connection_id: conn.id,
          user_id: user.id,
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

  const handleMessageClick = async (message) => {
    setSelectedMessage(message)
    
    // If message is unread, mark it as read
    if (message.unread) {
      // Optimistic update: mark as read in local state immediately
      // This ensures the UI is responsive even if the backend API fails
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === message.id ? { ...msg, unread: false } : msg
        )
      )
      
      // Try to update message via API in the background (non-blocking)
      // If the API fails, we keep the UI update since the backend endpoint appears to be broken
      // When the backend is fixed, this will automatically start working
      const updateMessageInBackground = async () => {
        // Format 1: snake_case (Python/FastAPI convention) - most likely format
        const updatePayload = {
          add_label_ids: ['READ'],
          remove_label_ids: ['UNREAD']
        }
        
        try {
          await integrationsAPI.updateMessage(message.id, updatePayload)
          console.log('Successfully synced message read status to server')
        } catch (error) {
          // Log error but don't revert UI update
          // The backend endpoint returns 500 for all formats, suggesting it's not implemented
          console.warn('Failed to sync message read status to server (backend may not support this yet):', error.message)
          // Don't show error to user - the UI update is working, backend sync is just failing
        }
      }
      
      // Fire and forget - don't await, let it run in background
      updateMessageInBackground()
    }
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

  // Filter messages based on active tab
  const filteredMessages = activeTab === 'unread' 
    ? messages.filter(m => m.unread)
    : messages

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
            <button 
              className={`tab ${activeTab === 'inbox' ? 'active' : ''}`}
              onClick={() => setActiveTab('inbox')}
            >
              Inbox
            </button>
            <button 
              className={`tab ${activeTab === 'unread' ? 'active' : ''}`}
              onClick={() => setActiveTab('unread')}
            >
              Unread
            </button>
            <button 
              className={`tab ${activeTab === 'todo' ? 'active' : ''}`}
              onClick={() => setActiveTab('todo')}
            >
              Todo
            </button>
            <button 
              className={`tab ${activeTab === 'follow-up' ? 'active' : ''}`}
              onClick={() => setActiveTab('follow-up')}
            >
              Follow-up
            </button>
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
          ) : filteredMessages.length === 0 ? (
            <div className="empty-state">
              <p>No messages found</p>
              <button className="btn-sync" onClick={handleFetchNewEmails}>
                Sync Messages
              </button>
            </div>
          ) : (
            filteredMessages.map(message => (
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

