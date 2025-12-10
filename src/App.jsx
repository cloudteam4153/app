import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import DailyBrief from './pages/DailyBrief'
import AccountInbox from './pages/AccountInbox'
import Inbox from './pages/Inbox'
import Settings from './pages/Settings'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="/" element={<DailyBrief />} />
      <Route path="/daily-brief" element={<DailyBrief />} />
      <Route path="/login" element={<Login />} />
      <Route path="/inbox" element={<Inbox />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/account/:accountId" element={<AccountInbox />} />
    </Routes>
  )
}

export default App

