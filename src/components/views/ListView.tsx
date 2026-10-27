'use client'

/**
 * ============================================================================
 * LIST VIEW COMPONENT (ListView.tsx)
 * ============================================================================
 * HOW IT WORKS:
 * Displays tasks in a clean, horizontal row-based list format.
 * 
 * CORE FEATURES:
 * 1. Empty State Fallback: Shows helpful placeholder when no tasks match current filters.
 * 2. Row Details: Checkbox, task title, description preview, due date badge, live SLA clock,
 *    status chip, and category indicator.
 * 3. Quick Actions: Workflow transition buttons (move back/forward), edit, and delete triggers.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Direct user interactions trigger state mutations in `TaskContext.tsx`,
 *   which update the local state optimistically and persist changes into Neon PostgreSQL.
 */

import React from 'react'
import { Task } from '@/types'
import { useTasks } from '@/context/TaskContext'
import { formatDate, formatDuration } from '@/lib/utils'
import { Calendar, Clock, ArrowRight, ArrowLeft, Trash2, Edit2 } from 'lucide-react'

interface Props {
  onEdit: (task: Task) => void
}

export const ListView: React.FC<Props> = ({ onEdit }) => {
  const { filteredTasks, moveTaskStatus, deleteTask, calculateTaskSLAMetrics } = useTasks()

  // Render empty state if no tasks match the active filters
  if (filteredTasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
        <p className="text-sm text-slate-400">No tasks found. Press C or click "Add New Task" to create one.</p>
      </div>
    )
  }

  // Returns bullet color according to importance
  const categoryColor = (importance: string) => {
    switch (importance) {
      case 'High':
        return 'bg-[#FF8059]'
      case 'Medium':
        return 'bg-[#FBBF24]'
      default:
        return 'bg-[#38BDF8]'
    }
  }

  return (
    <div className="space-y-2.5">
      {filteredTasks.map((task) => {
        // Calculate dynamic real-time SLA metrics for this task
        const metrics = calculateTaskSLAMetrics(task)
        const isDone = task.status === 'Done'

        return (
          <div
            key={task.id}
            className="group flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition bg-white shadow-xs"
          >
            {/* Left: Completion Checkbox + Title + Description */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => {
                  if (isDone) moveTaskStatus(task.id, 'To Do')
                  else moveTaskStatus(task.id, 'Done')
                }}
                className="w-4 h-4 rounded text-slate-900 focus:ring-0 border-slate-300 transition cursor-pointer"
              />
              <div>
                <span
                  className={`text-sm font-medium ${
                    isDone ? 'line-through text-slate-400' : 'text-slate-800'
                  }`}
                >
                  {task.title}
                </span>
                {task.description && (
                  <span className="text-xs text-slate-400 ml-2 hidden sm:inline">
                    - {task.description}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Badges, SLA Timer, and Quick Action Controls */}
            <div className="flex items-center gap-3 pl-7 md:pl-0 flex-wrap">
              {/* Due Date badge */}
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDate(task.dueDate)}</span>
              </span>

              {/* Real-time SLA Live Clock */}
              <span className="inline-flex items-center gap-1 text-xs bg-slate-100 px-2.5 py-0.5 rounded-md font-mono font-medium text-slate-700">
                <Clock className="w-3 h-3 text-slate-400" />
                {isDone ? (
                  // Strictly 0s when in Done stage
                  <span className="text-emerald-600">0s (Done)</span>
                ) : (
                  // Live active ticking clock
                  <span className="text-indigo-600">
                    {formatDuration(metrics.timeInCurrentSectionSeconds)}
                  </span>
                )}
              </span>

              {/* Workflow Status Badge */}
              <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {task.status}
              </span>

              {/* Category Tag */}
              <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
                <span className={`w-2 h-2 rounded-full ${categoryColor(task.importance)}`} />
                <span>{task.category || 'General'}</span>
              </span>

              {/* Stage Transition Quick Buttons */}
              <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition">
                {/* Move backward to To Do */}
                {task.status === 'In Progress' && (
                  <button
                    onClick={() => moveTaskStatus(task.id, 'To Do')}
                    className="p-1 text-slate-400 hover:text-slate-800"
                    title="Move back to To Do"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                )}
                {/* Move forward to In Progress */}
                {task.status === 'To Do' && (
                  <button
                    onClick={() => moveTaskStatus(task.id, 'In Progress')}
                    className="p-1 text-slate-400 hover:text-indigo-600"
                    title="Move to In Progress"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {/* Mark as Done */}
                {task.status === 'In Progress' && (
                  <button
                    onClick={() => moveTaskStatus(task.id, 'Done')}
                    className="p-1 text-slate-400 hover:text-emerald-600"
                    title="Mark Done"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {/* Edit Task Dialog Trigger */}
                <button
                  onClick={() => onEdit(task)}
                  className="p-1 text-slate-400 hover:text-blue-600"
                  title="Edit Task"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {/* Delete Task */}
                <button
                  onClick={() => {
                    if (confirm(`Delete "${task.title}"?`)) deleteTask(task.id)
                  }}
                  className="p-1 text-slate-400 hover:text-red-600"
                  title="Delete Task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* View details arrow */}
              <button
                onClick={() => onEdit(task)}
                aria-label="View task details"
                className="text-slate-300 group-hover:text-slate-600 transition pl-1"
                type="button"
              >
                <span className="text-lg font-bold">›</span>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

