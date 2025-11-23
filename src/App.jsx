import React, { useState } from 'react'
import './App.css'

function App() {
  const [expandedSections, setExpandedSections] = useState({
    overdue: true,
    todo: true,
    followup: true
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })

  return (
    <div className="app">
      <header className="app-header">
        <h1>Unified Inbox Assistant</h1>
        <p className="subtitle">Gmail + Slack • Daily Brief • Task Management</p>
      </header>
      <main className="app-main">
        <div className="daily-brief">
          <div className="brief-header">
            <h2 className="brief-title">Daily Brief</h2>
            <p className="brief-date">{dateStr} • Today • {dayName}</p>
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
  )
}

export default App

