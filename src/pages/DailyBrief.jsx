import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'
import { integrationsAPI, actionsAPI, classificationAPI } from '../services/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'

function DailyBrief() {
  const { user, isAuthenticated } = useAuth()
  const [expandedSections, setExpandedSections] = useState({
    overdue: true,
    todo: true,
    followup: true
  })
  const [isConnected, setIsConnected] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [selectedAccount, setSelectedAccount] = useState('all')
  const [showAccountDropdown, setShowAccountDropdown] = useState(false)
  const [connectedAccounts, setConnectedAccounts] = useState([
    { id: 'all', name: 'All Accounts', type: 'all', icon: '📋' }
  ])
  const [connectedEmails, setConnectedEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState([])
  const [tasksLoading, setTasksLoading] = useState(true)
  const [brief, setBrief] = useState(null)
  const [briefLoading, setBriefLoading] = useState(false)
  const [classifications, setClassifications] = useState([])
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const [hasShownLoginSuccess, setHasShownLoginSuccess] = useState(false)

  // Show login success message on first mount if authenticated
  useEffect(() => {
    if (user && isAuthenticated && !hasShownLoginSuccess) {
      setMessage({ type: 'success', text: 'Login successful! Welcome to Unified Inbox Assistant.' })
      setHasShownLoginSuccess(true)
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    }
  }, [user, isAuthenticated, hasShownLoginSuccess])

  // Load connections and tasks on mount
  useEffect(() => {
    loadConnections()
    loadTasks()
    loadTodayBrief()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAccountDropdown(false)
      }
    }

    if (showAccountDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAccountDropdown])

  const loadConnections = async () => {
    try {
      setLoading(true)
      const response = await integrationsAPI.listConnections({ 
        is_active: true,
        limit: 100 
      })
      
      // Backend returns paginated response with {data: [...], page, size, ...}
      // or direct array, handle both cases
      const connections = Array.isArray(response) 
        ? response 
        : (response?.data && Array.isArray(response.data) ? response.data : [])
      
      // Extract email addresses from connections
      const emails = connections
        .filter(conn => conn.provider_account_id)
        .map(conn => conn.provider_account_id)
      setConnectedEmails(emails)
      
      const accounts = [
        { id: 'all', name: 'All Accounts', type: 'all', icon: '📋' },
        ...connections.map(conn => ({
          id: conn.id,
          name: conn.provider_account_id || `${conn.provider} Account`,
          type: conn.provider?.toLowerCase() || 'unknown',
          icon: conn.provider?.toLowerCase() === 'gmail' ? '📧' : 
                conn.provider?.toLowerCase() === 'slack' ? '💬' : '📋'
        }))
      ]
      setConnectedAccounts(accounts)
      setIsConnected(connections.length > 0)
    } catch (error) {
      console.error('Failed to load connections:', error)
      // Don't show error on initial load, just set empty state
      setConnectedEmails([])
      setConnectedAccounts([{ id: 'all', name: 'All Accounts', type: 'all', icon: '📋' }])
      setIsConnected(false)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
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
      
      const connections = connectedAccounts
        .filter(acc => acc.id !== 'all')
        .map(acc => acc.id)

      if (connections.length === 0) {
        setMessage({ type: 'error', text: 'No active connections to sync' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
        return
      }

      if (!user || !user.id) {
        setMessage({ type: 'error', text: 'User not authenticated' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
        return
      }

      // Create syncs for all connections
      const syncPromises = connections.map(connectionId => 
        integrationsAPI.createSync({
          connection_id: connectionId,
          user_id: user.id,
          sync_type: 'incremental'
        }).catch(error => {
          console.error(`Failed to sync connection ${connectionId}:`, error)
          return null
        })
      )

      await Promise.all(syncPromises)
      
      setMessage({ type: 'success', text: 'New emails and messages retrieved!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Failed to sync messages:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to sync messages' })
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    }
  }

  const handleAddAccount = () => {
    navigate('/settings')
  }

  const loadTasks = async () => {
    try {
      setTasksLoading(true)
      // Note: actionsAPI requires integer user_id, but we have UUID from auth
      // The backend expects user_id as a required parameter
      // For now, we'll try without user_id filter and let backend handle it
      // TODO: Map UUID user_id to integer user_id if needed
      const response = await actionsAPI.listTasks({
        status: 'open'
      })
      
      // Actions service returns List[TaskResponse] directly (array)
      const tasksList = Array.isArray(response) ? response : []
      setTasks(tasksList)
    } catch (error) {
      console.error('Failed to load tasks:', error)
      // Handle 404 specifically - endpoint might not exist or require different params
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        console.warn('Tasks endpoint returned 404 - endpoint may require user_id parameter')
      }
      setTasks([]) // Set empty array on error
    } finally {
      setTasksLoading(false)
    }
  }

  const handleTaskStatusToggle = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'open' ? 'done' : 'open'
      await actionsAPI.updateTask(taskId, { status: newStatus })
      // Reload tasks to reflect the change
      await loadTasks()
    } catch (error) {
      console.error('Failed to update task:', error)
      setMessage({ type: 'error', text: 'Failed to update task' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  // Categorize tasks into sections
  const now = new Date()
  const overdueTasks = tasks.filter(task => {
    if (task.status !== 'open') return false
    if (!task.due_at) return false
    const dueDate = new Date(task.due_at)
    return dueDate < now
  })

  const todoTasks = tasks.filter(task => {
    if (task.status !== 'open') return false
    if (!task.due_at) return true // No due date = todo
    const dueDate = new Date(task.due_at)
    return dueDate >= now // Due date in future = todo
  })

  // Follow-up section: Not available (endpoint returns 501)
  const followupTasks = []

  const loadTodayBrief = async () => {
    try {
      setBriefLoading(true)
      if (!user || !user.id) {
        setBriefLoading(false)
        return
      }
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      const response = await classificationAPI.listBriefs({
        user_id: user.id,
        brief_date: today
      })
      
      // Classification service returns List[BriefRead] directly (array)
      const briefsList = Array.isArray(response) ? response : []
      if (briefsList.length > 0) {
        // Use the most recent brief for today
        setBrief(briefsList[briefsList.length - 1])
      } else {
        setBrief(null) // Clear brief if none found
      }
    } catch (error) {
      console.error('Failed to load brief:', error)
      // Handle 404 specifically - no brief exists for this date (expected)
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        console.info('No brief found for today - this is normal if no brief has been generated yet')
        setBrief(null)
      } else {
        // For other errors, still clear the brief
        setBrief(null)
      }
    } finally {
      setBriefLoading(false)
    }
  }

  const handleGenerateBrief = async () => {
    try {
      setBriefLoading(true)
      setMessage({ type: 'info', text: 'Generating daily brief...' })
      
      if (!user || !user.id) {
        setMessage({ type: 'error', text: 'User not authenticated' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
        setBriefLoading(false)
        return
      }

      const today = new Date().toISOString().split('T')[0]
      const newBrief = await classificationAPI.createBrief({
        user_id: user.id,
        date: today,
        max_items: 50
      })
      
      setBrief(newBrief)
      setMessage({ type: 'success', text: 'Daily brief generated successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Failed to generate brief:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to generate brief' })
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    } finally {
      setBriefLoading(false)
    }
  }

  const handleClassifyMessages = async () => {
    try {
      setMessage({ type: 'info', text: 'Classifying messages...' })
      
      // First, get messages from integrations service
      const messagesResponse = await integrationsAPI.listMessages({ 
        limit: 100,
        sort_by: 'created_at',
        sort_order: 'desc'
      })
      const messagesList = Array.isArray(messagesResponse) ? messagesResponse : []
      
      if (messagesList.length === 0) {
        setMessage({ type: 'error', text: 'No messages found to classify' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
        return
      }

      // Get message IDs (need to map from integrations messages to classification messages)
      // Note: This is a simplified approach - in reality, you'd need to sync messages first
      // For now, we'll use the message IDs directly if they're UUIDs
      const messageIds = messagesList
        .map(msg => msg.id)
        .filter(id => id) // Filter out any invalid IDs
      
      if (messageIds.length === 0) {
        setMessage({ type: 'error', text: 'No valid message IDs found' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
        return
      }

      // Classify messages
      const classificationResponse = await classificationAPI.classifyMessages({
        message_ids: messageIds.slice(0, 50) // Limit to 50 messages
      })
      
      setClassifications(classificationResponse.classifications || [])
      setMessage({ type: 'success', text: `Classified ${classificationResponse.success_count || 0} messages successfully!` })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Failed to classify messages:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to classify messages' })
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    }
  }

  const handleGenerateTasksFromClassifications = async () => {
    try {
      if (classifications.length === 0) {
        setMessage({ type: 'error', text: 'No classifications available. Please classify messages first.' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
        return
      }

      setMessage({ type: 'info', text: 'Generating tasks from classifications...' })
      
      if (!user || !user.id) {
        setMessage({ type: 'error', text: 'User not authenticated' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
        return
      }

      const classificationIds = classifications.map(c => c.cls_id || c.id)
      const response = await classificationAPI.generateTasks({
        classification_ids: classificationIds,
        user_id: user.id
      })
      
      setMessage({ type: 'success', text: `Generated ${response.total_generated || 0} tasks successfully!` })
      // Reload tasks to show newly generated ones
      await loadTasks()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Failed to generate tasks:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to generate tasks' })
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    }
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
          {isAuthenticated && user && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginTop: '4px',
              fontSize: '0.85rem',
              color: '#4caf50'
            }}>
              <span style={{ fontSize: '0.75rem' }}>✓</span>
              <span>Logged in</span>
              {user.id && (
                <span style={{ color: '#666', fontSize: '0.75rem' }}>
                  (ID: {user.id.substring(0, 8)}...)
                </span>
              )}
            </div>
          )}
        </div>
        <div className="header-nav">
          <button className="nav-button" onClick={handleConnect}>
            {isConnected ? 'Connected' : 'Connect Email/Slack'}
          </button>
          <button className="nav-button" onClick={handleFetchNewEmails}>
            Fetch New Emails
          </button>
          <button className="nav-button" onClick={handleClassifyMessages}>
            Classify Messages
          </button>
          <button className="nav-button" onClick={handleGenerateBrief}>
            Generate Brief
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
            {(() => {
              return connectedAccounts.map(account => {
                const shouldShowEmail = account.id === 'all' && connectedEmails.length > 0
                return (
                  <button
                    key={account.id}
                    className={`account-item ${selectedAccount === account.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedAccount(account.id)
                      if (account.id !== 'all') {
                        navigate(`/account/${account.id}`)
                      }
                    }}
                    title={account.name}
                  >
                    <span className="account-icon">{account.icon}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                      <span className="account-name">{account.name}</span>
                      {shouldShowEmail && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: '#666', 
                          marginTop: '2px',
                          fontWeight: 'normal'
                        }}>
                          {connectedEmails.join(', ')}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            })()}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="brief-title">Daily Brief</h2>
                {brief && (
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    {brief.high_priority_count} high priority • {brief.todo_count} todos • {brief.followup_count} follow-ups
                  </div>
                )}
              </div>
              <p className="brief-date">
                {dateStr} • Today • {dayName} •{' '}
                <span 
                  ref={dropdownRef}
                  className="account-selector"
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                >
                  {selectedAccount === 'all' 
                    ? 'All Accounts'
                    : connectedAccounts.find(a => a.id === selectedAccount)?.name
                  }
                  <span className="dropdown-arrow">{showAccountDropdown ? '▲' : '▼'}</span>
                  {showAccountDropdown && (
                    <div className="account-dropdown">
                      {connectedAccounts.map(account => (
                        <div
                          key={account.id}
                          className={`dropdown-item ${selectedAccount === account.id ? 'selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedAccount(account.id)
                            setShowAccountDropdown(false)
                            if (account.id !== 'all') {
                              navigate(`/account/${account.id}`)
                            }
                          }}
                        >
                          {account.name}
                        </div>
                      ))}
                    </div>
                  )}
                </span>
              </p>
            </div>

          {/* Brief Items Section */}
          {brief && brief.items && brief.items.length > 0 && (
            <div className="task-section task-section-brief">
              <div className="section-header">
                <span className="chevron">▼</span>
                <h3 className="section-title">Brief Items ({brief.items.length})</h3>
              </div>
              <div className="section-content">
                {brief.items.map((item, index) => (
                  <div key={index} className="brief-item">
                    <div className="brief-item-header">
                      <span className="brief-item-priority" style={{ 
                        color: item.priority_score >= 7 ? '#d32f2f' : '#1976d2' 
                      }}>
                        Priority: {item.priority_score}
                      </span>
                      <span className="brief-item-label" style={{
                        backgroundColor: item.title.toLowerCase().includes('todo') ? '#e3f2fd' :
                                         item.title.toLowerCase().includes('followup') ? '#fff3e0' : '#f5f5f5',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem'
                      }}>
                        {item.title.split(':')[0]}
                      </span>
                    </div>
                    <div className="brief-item-title">{item.title}</div>
                    <div className="brief-item-description">{item.description}</div>
                    <div className="brief-item-meta">
                      <span>From: {item.sender}</span>
                      <span>Channel: {item.channel}</span>
                      {item.extracted_tasks && item.extracted_tasks.length > 0 && (
                        <span>Tasks: {item.extracted_tasks.length}</span>
                      )}
                    </div>
                  </div>
                ))}
                {classifications.length > 0 && (
                  <button 
                    className="btn-generate-tasks" 
                    onClick={handleGenerateTasksFromClassifications}
                    style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
                  >
                    Generate Tasks from Classifications
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Overdue Section */}
          <div className="task-section task-section-overdue">
            <div className="section-header" onClick={() => toggleSection('overdue')}>
              <span className="chevron">{expandedSections.overdue ? '▼' : '▶'}</span>
              <h3 className="section-title">Overdue ({overdueTasks.length})</h3>
            </div>
            {expandedSections.overdue && (
              <div className="section-content">
                {tasksLoading ? (
                  <div className="loading-state">Loading tasks...</div>
                ) : overdueTasks.length === 0 ? (
                  <div className="empty-state">No overdue tasks</div>
                ) : (
                  overdueTasks.map(task => (
                    <div key={task.task_id} className="task-item">
                      <input
                        type="checkbox"
                        className="task-checkbox"
                        checked={task.status === 'done'}
                        onChange={() => handleTaskStatusToggle(task.task_id, task.status)}
                      />
                      <div className="task-content">
                        <div className="task-text">{task.title}</div>
                        <div className="task-meta">
                          {task.due_at && (
                            <span className="task-due">
                              Due: {new Date(task.due_at).toLocaleDateString()}
                            </span>
                          )}
                          {task.priority && (
                            <span className="task-priority">Priority: {task.priority}</span>
                          )}
                          {task.sender && (
                            <span className="task-sender">From: {task.sender}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* To do Section */}
          <div className="task-section task-section-todo">
            <div className="section-header" onClick={() => toggleSection('todo')}>
              <span className="chevron">{expandedSections.todo ? '▼' : '▶'}</span>
              <h3 className="section-title">To do ({todoTasks.length})</h3>
            </div>
            {expandedSections.todo && (
              <div className="section-content">
                {tasksLoading ? (
                  <div className="loading-state">Loading tasks...</div>
                ) : todoTasks.length === 0 ? (
                  <div className="empty-state">No tasks to do</div>
                ) : (
                  todoTasks.map(task => (
                    <div key={task.task_id} className="task-item">
                      <input
                        type="checkbox"
                        className="task-checkbox"
                        checked={task.status === 'done'}
                        onChange={() => handleTaskStatusToggle(task.task_id, task.status)}
                      />
                      <div className="task-content">
                        <div className="task-text">{task.title}</div>
                        <div className="task-meta">
                          {task.due_at && (
                            <span className="task-due">
                              Due: {new Date(task.due_at).toLocaleDateString()}
                            </span>
                          )}
                          {task.priority && (
                            <span className="task-priority">Priority: {task.priority}</span>
                          )}
                          {task.sender && (
                            <span className="task-sender">From: {task.sender}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
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
                <div className="empty-state">
                  Follow-up functionality is not yet implemented
                </div>
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

