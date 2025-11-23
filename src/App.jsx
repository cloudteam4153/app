import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import DailyBrief from './pages/DailyBrief'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<DailyBrief />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  )
}

export default App

