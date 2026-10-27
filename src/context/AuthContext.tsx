'use client'

/**
 * ============================================================================
 * AUTHENTICATION CONTEXT (AuthContext)
 * ============================================================================
 * This context serves as the global state manager for user authentication.
 * 
 * HOW IT WORKS:
 * - Maintains current `user` object, `token` string, and `isLoading` status.
 * - Restores persisted sessions on initial page load from `localStorage`.
 * - Provides centralized `login`, `signup`, and `logout` actions.
 * - Generates Bearer authorization headers for authenticated API requests.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Consumed by `DashboardPage` (app/page.tsx) to redirect unauthenticated visitors to `/login`.
 * - Consumed by `TaskContext` to automatically fetch the user's tasks when logged in.
 * - Consumed by `Navbar` to display the active user's name/email and provide a Sign Out trigger.
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@/types'

/**
 * Interface defining all functions and state variables exposed by the AuthContext.
 */
interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  signup: (email: string, password: string, name?: string) => Promise<{ error?: string }>
  logout: () => void
  getAuthHeaders: () => Record<string, string>
}

// Create the React Context instance
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// The localStorage key where the JWT token is persisted across browser refreshes
const TOKEN_KEY = 'task_mgmt_token'

/**
 * AuthProvider Component
 * ----------------------------------------------------------------------------
 * Wraps the application hierarchy (inside `src/components/Providers.tsx`)
 * so that any child component can read auth state or dispatch login/logout.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Currently authenticated user profile
  const [user, setUser] = useState<User | null>(null)
  // Active JWT token string
  const [token, setToken] = useState<string | null>(null)
  // True while validating token on initial mount; prevents flash of login screen
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Session Restoration Effect
   * --------------------------------------------------------------------------
   * HOW IT WORKS:
   * 1. Reads `task_mgmt_token` from browser's `localStorage` on component mount.
   * 2. If present, calls GET `/api/auth/me` with the token in the Authorization header.
   * 3. If the server verifies the token is valid, sets `user` in state.
   * 4. If invalid or expired (401), removes the stale token and resets user state.
   * 
   * WHERE ITS EFFECTS LEAD:
   * - Allows users to refresh or navigate pages without being logged out.
   * - Sets `isLoading` to false so the protected layout can safely render.
   */
  useEffect(() => {
    async function loadUser() {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY)
        if (storedToken) {
          setToken(storedToken)
          const res = await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          })
          if (res.ok) {
            const data = await res.json()
            setUser(data.user)
          } else {
            // Token was invalid or expired on server
            localStorage.removeItem(TOKEN_KEY)
            setToken(null)
            setUser(null)
          }
        }
      } catch (err) {
        console.error('Error restoring session:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  /**
   * login
   * --------------------------------------------------------------------------
   * HOW IT WORKS:
   * Sends POST request to `/api/auth/login` with email and password credentials.
   * On success:
   * 1. Saves received JWT into `localStorage`.
   * 2. Updates `token` and `user` state.
   * 
   * WHERE ITS EFFECTS LEAD:
   * - Login page transitions away and redirects to `/` dashboard.
   * - `TaskContext` detects `user` presence and automatically triggers task fetch.
   * 
   * @param {string} email - User email address
   * @param {string} password - User plaintext password to verify with bcrypt
   * @returns {Promise<{ error?: string }>} Object containing error message if failed
   */
  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { error: data.error || 'Login failed' }
      }

      localStorage.setItem(TOKEN_KEY, data.token)
      setToken(data.token)
      setUser(data.user)
      return {}
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred' }
    }
  }

  /**
   * signup
   * --------------------------------------------------------------------------
   * HOW IT WORKS:
   * Sends POST request to `/api/auth/signup` with registration fields.
   * On success:
   * 1. Stores issued token in `localStorage`.
   * 2. Initializes `user` state.
   * 
   * WHERE ITS EFFECTS LEAD:
   * - User is immediately logged in upon account creation and routed to dashboard.
   * 
   * @param {string} email - User email
   * @param {string} password - User password (min 6 characters)
   * @param {string} name - Optional display name
   * @returns {Promise<{ error?: string }>}
   */
  const signup = async (email: string, password: string, name?: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { error: data.error || 'Signup failed' }
      }

      localStorage.setItem(TOKEN_KEY, data.token)
      setToken(data.token)
      setUser(data.user)
      return {}
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred' }
    }
  }

  /**
   * logout
   * --------------------------------------------------------------------------
   * HOW IT WORKS:
   * Purges the stored JWT token from `localStorage` and sets React state to null.
   * 
   * WHERE ITS EFFECTS LEAD:
   * - Clears credentials from browser.
   * - Triggers auth guard in `DashboardPage` which immediately redirects user to `/login`.
   * - Clears task data from memory.
   */
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  /**
   * getAuthHeaders
   * --------------------------------------------------------------------------
   * HOW IT WORKS:
   * Checks current `token` state (or falls back to `localStorage`) and formats
   * standard HTTP Bearer authorization headers.
   * 
   * WHERE ITS EFFECTS LEAD:
   * - Attached to every downstream fetch call in `TaskContext` so the server can
   *   authenticate the requesting user.
   * 
   * @returns {Record<string, string>} { Authorization: 'Bearer <token>' } or empty object
   */
  const getAuthHeaders = (): Record<string, string> => {
    const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null)
    return currentToken ? { Authorization: `Bearer ${currentToken}` } : {}
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        signup,
        logout,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth Hook
 * ----------------------------------------------------------------------------
 * HOW IT WORKS:
 * Convenient custom React hook to consume AuthContext. Throws an informative
 * error if invoked outside an `AuthProvider`.
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

