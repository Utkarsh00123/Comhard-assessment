import { format, formatDistanceToNow } from 'date-fns'
import { TaskImportance, TaskStatus } from '@/types'

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

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString)
    return format(d, 'MMM d, yyyy')
  } catch (e) {
    return dateString
  }
}

export function formatRelative(dateString: string): string {
  try {
    const d = new Date(dateString)
    return formatDistanceToNow(d, { addSuffix: true })
  } catch (e) {
    return dateString
  }
}

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
