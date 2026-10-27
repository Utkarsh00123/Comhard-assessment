'use client'

/**
 * ============================================================================
 * ROOT CONTEXT PROVIDERS COMPONENT (Providers.tsx)
 * ============================================================================
 * HOW IT WORKS:
 * Next.js App Router root layout is a Server Component by default.
 * This client-side wrapper nests our React Context providers:
 * 1. `AuthProvider`: Handles user login state, JWT token storage, and session restoration.
 * 2. `TaskProvider`: Handles task CRUD, filtering state, and the real-time SLA engine.
 * 
 * WHY THIS HIERARCHY MATTERS:
 * - `TaskProvider` depends on `useAuth()` to retrieve the authenticated user and Bearer headers.
 * - Therefore, `AuthProvider` MUST wrap `TaskProvider` so auth context is available on mount.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Makes authentication and task management globally accessible to all pages and UI components.
 */

import React from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { TaskProvider } from '@/context/TaskContext'

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <TaskProvider>{children}</TaskProvider>
    </AuthProvider>
  )
}

