import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { base44Client } from '../api/base44Client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const currentUser = base44Client.auth.getCurrentUser()
      setUser(currentUser)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const result = await base44Client.auth.login(email, password)
    const currentUser = result?.user || result
    setUser(currentUser)
    return result
  }, [])

  const loginWithGoogle = useCallback(() => {
    base44Client.auth.loginWithProvider('google')
  }, [])

  const logout = useCallback(async () => {
    try {
      await base44Client.auth.logout()
    } catch {
      // ignore errors on logout
    } finally {
      setUser(null)
    }
  }, [])

  const listAccounts = useCallback(async () => {
    return base44Client.auth.listAccounts()
  }, [])

  const createAccount = useCallback(async (data) => {
    const result = await base44Client.auth.createAccount(data)
    return result
  }, [])

  const updateAccount = useCallback(async (id, data) => {
    return base44Client.auth.updateAccount(id, data)
  }, [])

  const deleteAccount = useCallback(async (id) => {
    return base44Client.auth.deleteAccount(id)
  }, [])

  const resetByManagerCode = useCallback(async ({ email, managerCode, newPassword }) => {
    return base44Client.auth.resetPasswordByManagerCode({ email, managerCode, newPassword })
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    logout,
    listAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    resetByManagerCode,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
