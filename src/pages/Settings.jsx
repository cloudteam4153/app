import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Settings.css'
import { integrationsAPI, healthAPI } from '../services/api.js'
import { TEST_USER_ID, API_BASE_URL } from '../config/api.js'

function Settings() {
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const navigate = useNavigate()

  // Fetch connections on mount
  useEffect(() => {
    loadConnections()
  }, [])

  const loadConnections = async () => {
    try {
      setLoading(true)
      const response = await integrationsAPI.listConnections({ limit: 100 })
      // Integrations service returns List[ConnectionRead] directly (array)
      const connectionsList = Array.isArray(response) ? response : []
      setConnections(connectionsList)
    } catch (error) {
      console.error('Failed to load connections:', error)
      setMessage({ type: 'error', text: 'Failed to load connections. Please check your API configuration.' })
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectGmail = async () => {
    setMessage({ type: '', text: '' })
    try {
      // Create a new Gmail connection
      // According to integrations service schema: requires user_id and provider
      const connectionData = {
        user_id: TEST_USER_ID,
        provider: 'gmail'
      }
      
      console.log('[Settings] Attempting to create Gmail connection with data:', connectionData);
      const response = await integrationsAPI.createConnection(connectionData)
      console.log('[Settings] Connection creation response:', response);
      setMessage({ type: 'success', text: 'Gmail connection initiated! Please complete OAuth authorization.' })
      
      // Response is ConnectionInitiateResponse with auth_url field
      if (response.auth_url) {
        window.location.href = response.auth_url
      } else {
        // Fallback: reload connections
        await loadConnections()
      }
    } catch (error) {
      console.error('Failed to connect Gmail:', error)
      
      // Provide user-friendly error messages
      let errorMessage = error.message || 'Failed to connect Gmail. Please try again.'
      
      // Check for OAuth configuration errors
      if (errorMessage.includes('OAuth configuration error') || errorMessage.includes('client secrets file not found')) {
        errorMessage = 'Gmail OAuth is not configured. Please set up Google OAuth credentials to enable Gmail integration. See OAUTH_SETUP.md for instructions.'
      }
      
      setMessage({ type: 'error', text: errorMessage })
      setTimeout(() => setMessage({ type: '', text: '' }), 8000) // Show longer for setup instructions
    }
  }

  const handleDisconnect = async (connectionId) => {
    if (!window.confirm('Are you sure you want to disconnect this account?')) {
      return
    }

    try {
      await integrationsAPI.deleteConnection(connectionId)
      setMessage({ type: 'success', text: 'Account disconnected successfully' })
      await loadConnections()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Failed to disconnect:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to disconnect account' })
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    }
  }

  const handleTestConnection = async (connectionId) => {
    try {
      setMessage({ type: 'info', text: 'Testing connection...' })
      const result = await integrationsAPI.testConnection(connectionId)
      setMessage({ type: 'success', text: result.message || 'Connection test successful!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Connection test failed:', error)
      setMessage({ type: 'error', text: error.message || 'Connection test failed' })
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    }
  }

  const handleRefreshConnection = async (connectionId) => {
    try {
      setMessage({ type: 'info', text: 'Refreshing connection...' })
      await integrationsAPI.refreshConnection(connectionId)
      setMessage({ type: 'success', text: 'Connection refreshed successfully!' })
      await loadConnections()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Failed to refresh connection:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to refresh connection' })
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    }
  }

  const handleTestAPIConnection = async () => {
    try {
      setMessage({ type: 'info', text: 'Testing API connection to http://35.239.94.117:8000...' })
      
      const startTime = Date.now()
      const healthResponse = await healthAPI.check()
      const responseTime = Date.now() - startTime
      
      console.log('[Settings] Health check response:', healthResponse)
      console.log('[Settings] API_BASE_URL:', API_BASE_URL)
      console.log('[Settings] Response time:', responseTime, 'ms')
      
      setMessage({ 
        type: 'success', 
        text: `API connection successful! Response time: ${responseTime}ms. Service is healthy.` 
      })
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    } catch (error) {
      console.error('API connection test failed:', error)
      const errorMessage = error.message || 'Failed to connect to API'
      
      // Provide helpful error messages
      let userMessage = `API connection failed: ${errorMessage}`
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        userMessage = `Cannot connect to http://35.239.94.117:8000. Please check:\n1. The server is running\n2. Your network connection\n3. Firewall settings\n\nError: ${errorMessage}`
      }
      
      setMessage({ type: 'error', text: userMessage })
      setTimeout(() => setMessage({ type: '', text: '' }), 8000)
    }
  }

  const getProviderDisplayName = (provider) => {
    const providerMap = {
      'gmail': 'Gmail',
      'slack': 'Slack',
      'outlook': 'Outlook',
    }
    return providerMap[provider.toLowerCase()] || provider
  }

  const getStatusDisplay = (connection) => {
    if (connection.is_active) {
      return <span className="status-connected">● Connected</span>
    }
    if (connection.status === 'pending') {
      return <span className="status-pending">● Pending</span>
    }
    return <span className="status-disconnected">● Not Connected</span>
  }

  const gmailConnections = connections.filter(c => c.provider?.toLowerCase() === 'gmail')
  const otherConnections = connections.filter(c => c.provider?.toLowerCase() !== 'gmail')
  const hasGmailConnection = gmailConnections.length > 0

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div className="settings-nav">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Daily Brief
          </button>
          <button className="nav-button" onClick={() => navigate('/inbox')}>
            Inbox
          </button>
        </div>
        <h1>Settings</h1>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-content">
        <div className="settings-section">
          <div className="section-header-row">
            <h2>API Connection</h2>
            <button className="btn-refresh" onClick={handleTestAPIConnection}>
              Test Connection
            </button>
          </div>
          <div className="account-card" style={{ marginBottom: '2rem' }}>
            <div className="account-info">
              <h4>Backend API Server</h4>
              <p className="account-status" style={{ marginTop: '0.5rem' }}>
                <code style={{ fontSize: '0.9em', color: '#666' }}>http://35.239.94.117:8000</code>
              </p>
              <p className="account-meta" style={{ marginTop: '0.5rem', fontSize: '0.85em', color: '#888' }}>
                Click "Test Connection" to verify the API server is reachable and healthy.
              </p>
            </div>
          </div>

          <div className="section-header-row" style={{ marginTop: '2rem' }}>
            <h2>Connected Accounts</h2>
            <button className="btn-refresh" onClick={loadConnections} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {loading && connections.length === 0 ? (
            <div className="loading-state">Loading connections...</div>
          ) : (
            <>
              {/* Gmail Section */}
              <div className="provider-section">
                <h3>Gmail</h3>
                {gmailConnections.length > 0 ? (
                  gmailConnections.map(connection => (
                    <div key={connection.id} className="account-card">
                      <div className="account-info">
                        <h4>
                          {connection.provider_account_id 
                            ? connection.provider_account_id 
                            : 'Gmail Account'}
                        </h4>
                        <p className="account-status">
                          {getStatusDisplay(connection)}
                        </p>
                        {connection.last_synced_at && (
                          <p className="account-meta">
                            Last synced: {new Date(connection.last_synced_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="account-actions">
                        <button 
                          className="btn-action-small" 
                          onClick={() => handleTestConnection(connection.id)}
                          title="Test Connection"
                        >
                          Test
                        </button>
                        <button 
                          className="btn-action-small" 
                          onClick={() => handleRefreshConnection(connection.id)}
                          title="Refresh Connection"
                        >
                          Refresh
                        </button>
                        <button 
                          className="btn-disconnect" 
                          onClick={() => handleDisconnect(connection.id)}
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="account-card">
                    <div className="account-info">
                      <h4>No Gmail accounts connected</h4>
                      <p className="account-status">
                        <span className="status-disconnected">● Not Connected</span>
                      </p>
                    </div>
                    <button className="btn-connect" onClick={handleConnectGmail}>
                      Connect Gmail
                    </button>
                  </div>
                )}
              </div>

              {/* Other Providers */}
              {otherConnections.length > 0 && (
                <div className="provider-section">
                  <h3>Other Accounts</h3>
                  {otherConnections.map(connection => (
                    <div key={connection.id} className="account-card">
                      <div className="account-info">
                        <h4>{getProviderDisplayName(connection.provider)}</h4>
                        {connection.provider_account_id && (
                          <p className="account-email" style={{ 
                            color: '#666', 
                            fontSize: '0.9em', 
                            marginTop: '4px',
                            fontWeight: 'normal'
                          }}>
                            {connection.provider_account_id}
                          </p>
                        )}
                        <p className="account-status">
                          {getStatusDisplay(connection)}
                        </p>
                        {connection.provider_account_id && (
                          <p className="account-meta" style={{ display: 'none' }}>{connection.provider_account_id}</p>
                        )}
                      </div>
                      <div className="account-actions">
                        <button 
                          className="btn-action-small" 
                          onClick={() => handleTestConnection(connection.id)}
                          title="Test Connection"
                        >
                          Test
                        </button>
                        <button 
                          className="btn-action-small" 
                          onClick={() => handleRefreshConnection(connection.id)}
                          title="Refresh Connection"
                        >
                          Refresh
                        </button>
                        <button 
                          className="btn-disconnect" 
                          onClick={() => handleDisconnect(connection.id)}
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Connection */}
              <div className="provider-section">
                <h3>Add New Account</h3>
                <div className="account-card">
                  <div className="account-info">
                    <h4>Connect a new email or messaging account</h4>
                    <p className="account-status">
                      <span className="status-disconnected">● Not Connected</span>
                    </p>
                  </div>
                  <button className="btn-connect" onClick={handleConnectGmail}>
                    Connect Gmail
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings

