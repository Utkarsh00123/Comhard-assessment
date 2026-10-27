'use client'

/**
 * ============================================================================
 * GRID VIEW COMPONENT (GridView.tsx)
 * ============================================================================
 * HOW IT WORKS:
 * Displays tasks in a responsive CSS Grid layout (1 column on mobile, 2 columns
 * on tablets, 3 columns on desktop displays).
 * 
 * CORE FEATURES:
 * - Consumes `filteredTasks` from `TaskContext.tsx`.
 * - Maps each task to an instance of the reusable `TaskCard` component.
 * - Handles empty filter states gracefully with a centered placeholder.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Provides a visual card-based dashboard for browsing and managing tasks.
 */

import React from 'react'
import { Task } from '@/types'
import { useTasks } from '@/context/TaskContext'
import { TaskCard } from '../TaskCard'

interface Props {
  onEdit: (task: Task) => void
}

export const GridView: React.FC<Props> = ({ onEdit }) => {
  const { filteredTasks } = useTasks()

  // Empty state fallback when no tasks match current filter criteria
  if (filteredTasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-slate-500 text-sm">No tasks match the active filters.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredTasks.map((task) => (
        <TaskCard key={task.id} task={task} onEdit={onEdit} />
      ))}
    </div>
  )
}

