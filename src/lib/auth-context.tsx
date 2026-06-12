'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'agency' | 'affiliate' | 'superadmin'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: UserRole
  tier: string
  avatarUrl: string | null
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (params: {
    email: string
    password: string
    name?: string
    role?: UserRole
    referralCode?: string
  }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

// ── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.user) {
            setUser(data.user)
          }
        }
      } catch {
        // Not authenticated, that's fine
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (data.success && data.user) {
        setUser(data.user)
        return { success: true }
      }

      return { success: false, error: data.error || 'Login failed' }
    } catch {
      return { success: false, error: 'Network error' }
    }
  }, [])

  const register = useCallback(async (params: {
    email: string
    password: string
    name?: string
    role?: UserRole
    referralCode?: string
  }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      const data = await res.json()

      if (data.success && data.user) {
        setUser(data.user)
        return { success: true }
      }

      return { success: false, error: data.error || 'Registration failed' }
    } catch {
      return { success: false, error: 'Network error' }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore errors
    }
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.user) {
          setUser(data.user)
        }
      }
    } catch {
      // Ignore
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
