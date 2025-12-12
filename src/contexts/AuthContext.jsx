import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  /**
   * Check authentication status by calling /auth/me
   */
  const checkAuth = async () => {
    try {
      setLoading(true)
      const response = await authAPI.getCurrentUser()
      if (response && response.user_id) {
        setUser({ id: response.user_id })
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      // 401 or other error means not authenticated
      console.log('[Auth] Not authenticated:', error.message)
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Logout user (clear auth state)
   * Note: Backend should clear cookies, but we clear local state
   */
  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    // Optionally clear any local storage
    localStorage.removeItem('refresh_token')
  }

  // Check auth on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated,
    checkAuth,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
