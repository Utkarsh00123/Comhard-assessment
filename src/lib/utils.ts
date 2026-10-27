/**
 * ============================================================================
 * UTILITY FUNCTIONS & FORMATTERS
 * ============================================================================
 * This module provides reusable string formatters, time calculation helpers,
 * and badge color mappings used across views, cards, and metrics bars.
 */

import { format, formatDistanceToNow } from 'date-fns'
import { TaskImportance, TaskStatus } from '@/types'

/**
 * formatDuration
 * ----------------------------------------------------------------------------
 * HOW IT WORKS:
 * Takes an integer number of elapsed seconds and decomposes it into hours (h),
 * minutes (m), and seconds (s). Protects against negative values by clamping to 0.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Used in `TaskCard.tsx` to render the live active section clock.
 * - Used in `ListView.tsx` for table row timing badges.
 * - Used in `SLAMetricsBar.tsx` for the cumulative time and average transition duration.
 * 
 * @param {number} totalSeconds - Total elapsed seconds
 * @returns {string} Human-readable string like '1h 24m 10s', '4m 32s', or '15s'
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

/**
 * formatDate
 * ----------------------------------------------------------------------------
 * HOW IT WORKS:
 * Parses an ISO 8601 date string using date-fns and formats it into a clean
 * presentation format: "MMM d, yyyy" (e.g., "Oct 27, 2026").
 * Includes a try-catch fallback that returns the original string if parsing fails.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Renders readable task due dates on cards, list items, and modal selectors.
 * 
 * @param {string} dateString - ISO date string from database or user input
 * @returns {string} Formatted date label
 */
export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString)
    return format(d, 'MMM d, yyyy')
  } catch (e) {
    return dateString
  }
}

/**
 * formatRelative
 * ----------------------------------------------------------------------------
 * HOW IT WORKS:
 * Formats a timestamp into relative human language (e.g. "in 3 days", "2 hours ago").
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Provides quick visual cues for deadlines and recent task activities.
 * 
 * @param {string} dateString - Target ISO timestamp
 * @returns {string} Relative time label
 */
export function formatRelative(dateString: string): string {
  try {
    const d = new Date(dateString)
    return formatDistanceToNow(d, { addSuffix: true })
  } catch (e) {
    return dateString
  }
}

/**
 * getImportanceBadgeColor
 * ----------------------------------------------------------------------------
 * HOW IT WORKS:
 * Maps the task priority level ('High', 'Medium', 'Low') to harmonious Tailwind CSS
 * classes defining background, text, and border styling.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Applied to priority pill tags across TaskCard, ListView, and filter badges.
 * - High = Red (urgent attention)
 * - Medium = Amber (normal priority)
 * - Low = Blue (low priority backlog)
 * 
 * @param {TaskImportance} importance - Task importance value
 * @returns {string} Tailwind CSS class string
 */
export function getImportanceBadgeColor(importance: TaskImportance): string {
  switch (importance) {
    case 'High':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'Medium':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'Low':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

/**
 * getStatusBadgeColor
 * ----------------------------------------------------------------------------
 * HOW IT WORKS:
 * Maps task status ('To Do', 'In Progress', 'Done') to distinct Tailwind CSS classes.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Used on status chips in task cards and list rows.
 * - To Do = Slate gray
 * - In Progress = Indigo (active work)
 * - Done = Emerald green (successful completion)
 * 
 * @param {TaskStatus} status - Task workflow stage
 * @returns {string} Tailwind CSS class string
 */
export function getStatusBadgeColor(status: TaskStatus): string {
  switch (status) {
    case 'To Do':
      return 'bg-slate-100 text-slate-700 border-slate-300'
    case 'In Progress':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    case 'Done':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

