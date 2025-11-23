import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Inbox.css'

function Inbox() {
  const [emails, setEmails] = useState([])
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [showCompose, setShowCompose] = useState(false)
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' })
  const [message, setMessage] = useState({ type: '', text: '' })
  const navigate = useNavigate()

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

  const handleDelete = (id) => {
    setEmails(emails.filter(e => e.id !== id))
    if (selectedEmail?.id === id) {
      setSelectedEmail(null)
    }
    setMessage({ type: 'success', text: 'Email deleted' })
    setTimeout(() => setMessage({ type: '', text: '' }), 2000)
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      setMessage({ type: 'error', text: 'Please select emails to delete' })
      setTimeout(() => setMessage({ type: '', text: '' }), 2000)
      return
    }
    setEmails(emails.filter(e => !selectedIds.includes(e.id)))
    if (selectedEmail && selectedIds.includes(selectedEmail.id)) {
      setSelectedEmail(null)
    }
    setMessage({ type: 'success', text: `${selectedIds.length} email(s) deleted` })
    setSelectedIds([])
    setTimeout(() => setMessage({ type: '', text: '' }), 2000)
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

  const handleGetNewMail = () => {
    setMessage({ type: 'success', text: 'Checking for new emails...' })
    setTimeout(() => {
      const newEmail = {
        id: emails.length + 1,
        from: 'new.sender@example.com',
        subject: 'New Message',
        preview: 'This is a new email that just arrived...',
        date: 'Nov 12, 2024',
        read: false
      }
      setEmails([newEmail, ...emails])
      setMessage({ type: 'success', text: 'New emails retrieved!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 2000)
    }, 1000)
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
            <button className="btn-get-mail" onClick={handleGetNewMail}>
              Get New Mail
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
            <p>{selectedEmail.preview}</p>
            <p>This is the full email content. In a real application, this would be fetched from the email service.</p>
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
          <button className="btn-get-mail" onClick={handleGetNewMail}>
            Get New Mail
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
        {emails.length === 0 ? (
          <div className="empty-inbox">
            <p>No emails in inbox</p>
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
