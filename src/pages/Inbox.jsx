import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Inbox.css'
import { integrationsAPI } from '../services/api.js'
import { TEST_USER_ID } from '../config/api.js'

function Inbox() {
  const [emails, setEmails] = useState([])
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [showCompose, setShowCompose] = useState(false)
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Fetch messages on mount
  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    try {
      setLoading(true)
      
      const response = await integrationsAPI.listMessages({ 
        limit: 100,
        sort_by: 'created_at',
        sort_order: 'desc'
      })
      // Integrations service returns List[MessageRead] directly (array)
      const messagesList = Array.isArray(response) ? response : []
      
      // Transform API messages to email format
      // Note: Messages have snippet and raw (base64) fields
      // The raw field contains full email with headers, but requires base64 decoding and email parsing
      // For now, we'll use snippet and try to extract basic info
      const transformedEmails = messagesList.map(msg => {
        // Try to extract sender from snippet if it contains email-like patterns
        let from = 'Unknown Sender'
        let subject = msg.snippet ? msg.snippet.substring(0, 50) : '(No Subject)'
        
        // Use internal_date if available (Unix timestamp in milliseconds), otherwise use created_at
        let dateStr = 'Unknown'
        if (msg.internal_date) {
          dateStr = new Date(msg.internal_date).toLocaleDateString()
        } else if (msg.created_at) {
          dateStr = new Date(msg.created_at).toLocaleDateString()
        }
        
        return {
          id: msg.id,
          messageId: msg.id, // Keep original ID for API calls
          from: from,
          subject: subject,
          preview: msg.snippet || '', // Use snippet field from API
          date: dateStr,
          read: true, // Messages don't have is_read field in schema
          body: msg.raw || '', // Base64 encoded raw message
          snippet: msg.snippet || '',
          thread_id: msg.thread_id,
          external_id: msg.external_id,
          internal_date: msg.internal_date
        }
      })
      
      setEmails(transformedEmails)
    } catch (error) {
      console.error('Failed to load messages:', error)
      const errorMessage = error.message || 'Failed to load messages'
      // Check for network errors
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
        setMessage({ 
          type: 'error', 
          text: `Cannot connect to API server. Please ensure the integrations service is running on integrations-svc-ms2-ft4pa23xra-uc.a.run.app. Error: ${errorMessage}` 
        })
      } else {
        setMessage({ 
          type: 'error', 
          text: `Failed to load messages: ${errorMessage}` 
        })
      }
      setTimeout(() => setMessage({ type: '', text: '' }), 8000)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailClick = (email) => {
    setSelectedEmail(email)
    setEmails(emails.map(e => e.id === email.id ? { ...e, read: true } : e))
  }

  const handleBackToList = () => {
    setSelectedEmail(null)
  }

  const handleCheckboxChange = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === emails.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(emails.map(e => e.id))
    }
  }

  const handleDelete = async (id) => {
    const email = emails.find(e => e.id === id)
    if (!email?.messageId) {
      // Fallback to local delete if no messageId
      setEmails(emails.filter(e => e.id !== id))
      if (selectedEmail?.id === id) {
        setSelectedEmail(null)
      }
      setMessage({ type: 'success', text: 'Email deleted' })
      setTimeout(() => setMessage({ type: '', text: '' }), 2000)
      return
    }

    try {
      await integrationsAPI.deleteMessage(email.messageId)
      setEmails(emails.filter(e => e.id !== id))
      if (selectedEmail?.id === id) {
        setSelectedEmail(null)
      }
      setMessage({ type: 'success', text: 'Email deleted' })
      setTimeout(() => setMessage({ type: '', text: '' }), 2000)
    } catch (error) {
      console.error('Failed to delete message:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to delete email' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      setMessage({ type: 'error', text: 'Please select emails to delete' })
      setTimeout(() => setMessage({ type: '', text: '' }), 2000)
      return
    }

    try {
      // Get message IDs for selected emails
      const messageIds = emails
        .filter(e => selectedIds.includes(e.id))
        .map(e => e.messageId)
        .filter(id => id) // Filter out any undefined IDs

      if (messageIds.length > 0) {
        // Use bulk delete endpoint from composite service
        try {
          await integrationsAPI.bulkDeleteMessages(messageIds)
        } catch (error) {
          console.error('Bulk delete failed, trying individual deletes:', error)
          // Fallback to individual deletes if bulk fails
          for (const messageId of messageIds) {
            try {
              await integrationsAPI.deleteMessage(messageId)
            } catch (err) {
              console.error(`Failed to delete message ${messageId}:`, err)
            }
          }
        }
      }

      setEmails(emails.filter(e => !selectedIds.includes(e.id)))
      if (selectedEmail && selectedIds.includes(selectedEmail.id)) {
        setSelectedEmail(null)
      }
      setMessage({ type: 'success', text: `${selectedIds.length} email(s) deleted` })
      setSelectedIds([])
      setTimeout(() => setMessage({ type: '', text: '' }), 2000)
    } catch (error) {
      console.error('Failed to delete messages:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to delete emails' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const handleReply = () => {
    if (!selectedEmail) return
    setComposeData({
      to: selectedEmail.from,
      subject: `Re: ${selectedEmail.subject}`,
      body: `\n\n--- Original Message ---\n${selectedEmail.preview}`
    })
    setShowCompose(true)
    setSelectedEmail(null)
  }

  const handleForward = () => {
    if (!selectedEmail) return
    setComposeData({
      to: '',
      subject: `Fwd: ${selectedEmail.subject}`,
      body: `\n\n--- Forwarded Message ---\nFrom: ${selectedEmail.from}\nDate: ${selectedEmail.date}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.preview}`
    })
    setShowCompose(true)
    setSelectedEmail(null)
  }

  const handleSend = () => {
    if (!composeData.to || !composeData.subject) {
      setMessage({ type: 'error', text: 'Please fill in recipient and subject' })
      setTimeout(() => setMessage({ type: '', text: '' }), 2000)
      return
    }
    setMessage({ type: 'success', text: 'Email sent successfully!' })
    setShowCompose(false)
    setComposeData({ to: '', subject: '', body: '' })
    setTimeout(() => setMessage({ type: '', text: '' }), 2000)
  }

  const handleSync = async () => {
    try {
      setMessage({ type: 'info', text: 'Syncing messages from all connections...' })
      
      // Call POST /syncs with default incremental payload
      // The endpoint automatically finds all active connections for the current user
      await integrationsAPI.createSync({
        sync_type: 'incremental'
      })
      
      // Wait a bit for syncs to process, then reload messages
      setTimeout(async () => {
        await loadMessages()
        setMessage({ type: 'success', text: 'New messages retrieved!' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      }, 2000)
    } catch (error) {
      console.error('Failed to sync messages:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to sync messages. Please try again.' })
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    }
  }

  if (showCompose) {
    return (
      <div className="inbox-container">
        <div className="inbox-header">
          <button className="back-button" onClick={() => setShowCompose(false)}>
            ← Back
          </button>
          <h1>Compose Email</h1>
        </div>
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        <div className="compose-form">
          <div className="form-group">
            <label>To</label>
            <input
              type="email"
              value={composeData.to}
              onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
              placeholder="recipient@example.com"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Subject</label>
            <input
              type="text"
              value={composeData.subject}
              onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
              placeholder="Email subject"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Body</label>
            <textarea
              value={composeData.body}
              onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
              placeholder="Type your message here..."
              className="form-textarea"
              rows="10"
            />
          </div>
          <div className="compose-actions">
            <button className="btn-send" onClick={handleSend}>Send</button>
            <button className="btn-cancel" onClick={() => setShowCompose(false)}>Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  if (selectedEmail) {
    return (
      <div className="inbox-container">
        <div className="inbox-header">
          <button className="back-button" onClick={handleBackToList}>
            ← Back to Inbox
          </button>
          <div className="header-actions">
            <button className="btn-sync" onClick={handleSync}>
              Sync
            </button>
            <button className="btn-daily-brief" onClick={() => navigate('/daily-brief')}>
              Daily Brief
            </button>
            <button className="btn-settings" onClick={() => navigate('/settings')}>
              Settings
            </button>
          </div>
        </div>
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        <div className="email-detail">
          <div className="email-detail-header">
            <h2>{selectedEmail.subject}</h2>
            <div className="email-actions">
              <button className="btn-action" onClick={handleReply}>Reply</button>
              <button className="btn-action" onClick={handleForward}>Forward</button>
              <button className="btn-action btn-delete" onClick={() => handleDelete(selectedEmail.id)}>
                Delete
              </button>
            </div>
          </div>
          <div className="email-meta">
            <p><strong>From:</strong> {selectedEmail.from}</p>
            <p><strong>Date:</strong> {selectedEmail.date}</p>
          </div>
          <div className="email-body">
            {selectedEmail.body ? (
              <div dangerouslySetInnerHTML={{ __html: selectedEmail.body.replace(/\n/g, '<br>') }} />
            ) : (
              <>
                <p>{selectedEmail.preview}</p>
                <p>Full email content not available. This may be a preview-only message.</p>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="inbox-container">
      <div className="inbox-header">
        <h1>Inbox</h1>
        <div className="header-actions">
          <button className="btn-sync" onClick={handleSync}>
            Sync
          </button>
          <button className="btn-compose" onClick={() => setShowCompose(true)}>
            Compose
          </button>
          <button className="btn-daily-brief" onClick={() => navigate('/daily-brief')}>
            Daily Brief
          </button>
          <button className="btn-settings" onClick={() => navigate('/settings')}>
            Settings
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="inbox-toolbar">
        <div className="toolbar-left">
          <input
            type="checkbox"
            checked={selectedIds.length === emails.length && emails.length > 0}
            onChange={handleSelectAll}
            className="checkbox-select-all"
          />
          <span className="select-all-text">Select All</span>
        </div>
        <div className="toolbar-right">
          {selectedIds.length > 0 && (
            <button className="btn-bulk-delete" onClick={handleBulkDelete}>
              Delete Selected ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      <div className="email-list">
        {loading ? (
          <div className="empty-inbox">
            <p>Loading messages...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="empty-inbox">
            <p>No emails in inbox</p>
            <button className="btn-get-mail" onClick={handleSync} style={{ marginTop: '1rem' }}>
              Sync Messages
            </button>
          </div>
        ) : (
          emails.map(email => (
            <div
              key={email.id}
              className={`email-item ${!email.read ? 'unread' : ''} ${selectedIds.includes(email.id) ? 'selected' : ''}`}
              onClick={() => handleEmailClick(email)}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(email.id)}
                onChange={(e) => {
                  e.stopPropagation()
                  handleCheckboxChange(email.id)
                }}
                className="email-checkbox"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="email-content">
                <div className="email-header">
                  <span className="email-from">{email.from}</span>
                  <span className="email-date">{email.date}</span>
                </div>
                <div className="email-subject">{email.subject}</div>
                <div className="email-preview">{email.preview}</div>
              </div>
              <button
                className="email-delete-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(email.id)
                }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Inbox
