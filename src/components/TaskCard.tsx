'use client'

/**
 * ============================================================================
 * MODULAR TASK CARD COMPONENT (TaskCard.tsx)
 * ============================================================================
 * HOW IT WORKS:
 * An agnostic, reusable task card consumed across GridView, KanbanView, and SectionView.
 * 
 * CORE FEATURES:
 * 1. Checkbox Toggle: Instantly toggles between 'To Do' and 'Done'.
 * 2. Visual Metadata: Title (struck-through when Done), description snippet, due date,
 *    category dot indicator, and importance pill badge.
 * 3. Embedded SLA Counter: Shows active section timer in real time (clamped to 0s when Done),
 *    cumulative active lifecycle seconds, and stage transition counter.
 * 4. Quick Workflow Action Arrows: Allows one-click stage moves (e.g. To Do -> In Progress -> Done,
 *    or backward movement from In Progress -> To Do).
 * 5. Edit & Delete Controls: Triggers modal editing or confirmation deletion.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Direct calls to `moveTaskStatus()` or `deleteTask()` update `TaskContext.tsx`,
 *   which synchronously makes PATCH/DELETE requests to `/api/tasks/[id]` in Neon Postgres.
 */

import React from 'react'
import { Task, TaskStatus } from '@/types'
import { useTasks } from '@/context/TaskContext'
import { formatDuration, formatDate } from '@/lib/utils'
import { Clock, Calendar, ArrowRight, ArrowLeft, Trash2, Edit2 } from 'lucide-react'

interface Props {
  task: Task
  onEdit: (task: Task) => void
}

export const TaskCard: React.FC<Props> = ({ task, onEdit }) => {
  const { moveTaskStatus, deleteTask, calculateTaskSLAMetrics } = useTasks()
  
  // Real-time SLA metrics for this task instance
  const metrics = calculateTaskSLAMetrics(task)

  const isDone = task.status === 'Done'

  /**
   * handleToggleDone
   * --------------------------------------------------------------------------
   * Quick checkbox handler. If already Done, re-opens task to 'To Do';
   * otherwise, completes the task to 'Done'.
   */
  const handleToggleDone = () => {
    if (isDone) {
      moveTaskStatus(task.id, 'To Do')
    } else {
      moveTaskStatus(task.id, 'Done')
    }
  }

  // Returns accent color for category indicator based on priority
  const categoryColor = () => {
    switch (task.importance) {
      case 'High':
        return 'bg-[#FF8059]'
      case 'Medium':
        return 'bg-[#FBBF24]'
      default:
        return 'bg-[#38BDF8]'
    }
  }

  return (
    <div className="group p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50 transition-all shadow-xs flex flex-col justify-between">
      <div>
        {/* Top: Checkbox, Title & Chevron quick-edit button */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={isDone}
              onChange={handleToggleDone}
              className="mt-0.5 w-4 h-4 rounded text-slate-900 focus:ring-0 border-slate-300 transition cursor-pointer"
            />
            <div>
              <h4
                className={`text-sm font-semibold ${
                  isDone ? 'line-through text-slate-400' : 'text-slate-900'
                }`}
              >
                {task.title}
              </h4>
              {task.description && (
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                  {task.description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => onEdit(task)}
            className="text-slate-300 group-hover:text-slate-600 transition"
            title="Edit task details"
          >
            <span className="text-base font-bold">›</span>
          </button>
        </div>

        {/* Metadata Badges Row (Due Date, Category, Importance) */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-slate-100 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {formatDate(task.dueDate)}
          </span>

          <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
            <span className={`w-2 h-2 rounded-full ${categoryColor()}`}></span>
            {task.category || 'General'}
          </span>

          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[11px]">
            {task.importance}
          </span>
        </div>

        {/* Real-Time Embedded SLA Metric Box */}
        <div className="mt-3 bg-[#F6F7F4] rounded-xl p-2.5 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[11px] flex items-center">
              <Clock className="w-3 h-3 mr-1 text-slate-400" />
              Active in section:
            </span>
            <span className="font-mono font-bold text-slate-800">
              {isDone ? (
                // SPEC RULE: When in Done, SLA is strictly 0s
                <span className="text-emerald-600">0s (Done)</span>
              ) : (
                // Active ticking elapsed duration
                <span className="text-indigo-600">
                  {formatDuration(metrics.timeInCurrentSectionSeconds)}
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Cumulative: {formatDuration(metrics.totalCumulativeTimeSeconds)}</span>
            <span>Moves: {task.stageTransitionsCount}</span>
          </div>
        </div>
      </div>

      {/* Stage Actions Toolbar */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {task.status}
        </span>
        <div className="flex items-center space-x-1">
          {/* Backward Movement: In Progress -> To Do */}
          {task.status === 'In Progress' && (
            <button
              onClick={() => moveTaskStatus(task.id, 'To Do')}
              className="p-1 text-slate-400 hover:text-slate-800"
              title="Move backward to To Do"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
          {/* Forward Movement: To Do -> In Progress */}
          {task.status === 'To Do' && (
            <button
              onClick={() => moveTaskStatus(task.id, 'In Progress')}
              className="p-1 text-slate-400 hover:text-indigo-600"
              title="Move to In Progress"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {/* Completion Movement: In Progress -> Done */}
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
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          {/* Delete Task Trigger */}
          <button
            onClick={() => {
              if (confirm(`Delete "${task.title}"?`)) deleteTask(task.id)
            }}
            className="p-1 text-slate-400 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

