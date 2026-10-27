'use client'

/**
 * ============================================================================
 * TOP NAVIGATION BAR (Navbar.tsx)
 * ============================================================================
 * HOW IT WORKS:
 * Renders the sticky top header of the application.
 * 
 * KEY ELEMENTS:
 * 1. Brand Logo & Title: Displays the TaskManager brand and icon.
 * 2. Database Status Badge: Indicates live connection to Neon PostgreSQL.
 * 3. User Identity Display: Shows the signed-in user's name/email from `AuthContext`.
 * 4. Sign Out Button: Dispatches `logout()`, removing the JWT and routing to `/login`.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Provides consistent top-level navigation and identity reassurance across pages.
 */

import React from 'react'
import { useAuth } from '@/context/AuthContext'
import { CheckSquare, LogOut, Database, User as UserIcon } from 'lucide-react'

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
              TaskManager
            </h1>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Database className="w-3 h-3 mr-1 text-emerald-600" />
                Neon Postgres Active
              </span>
            </div>
          </div>
        </div>

        {/* Authenticated user profile and logout button */}
        {user && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <UserIcon className="w-4 h-4 text-slate-500" />
              <span className="font-medium text-slate-800">{user.name || user.email}</span>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

