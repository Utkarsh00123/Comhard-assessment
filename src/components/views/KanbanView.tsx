'use client'

/**
 * ============================================================================
 * KANBAN VIEW COMPONENT (KanbanView.tsx)
 * ============================================================================
 * HOW IT WORKS:
 * Implements a 3-column workflow board ('To Do', 'In Progress', 'Done')
 * equipped with native HTML5 Drag and Drop.
 * 
 * CORE FEATURES:
 * 1. Status Column Partitioning: Filters `filteredTasks` into each status column.
 * 2. Drag & Drop Engine:
 *    - `onDragStart`: Sets the dragged task's ID in the dataTransfer clipboard.
 *    - `onDragOver`: Prevents default browser handling to allow drop target detection.
 *    - `onDrop`: Reads the dropped task ID and invokes `moveTaskStatus(taskId, targetStatus)`.
 * 3. Empty Column Drop Target: Shows a dashed drop zone when a column contains 0 tasks.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Dragging a card across columns executes the full SLA Engine transition logic
 *   in `TaskContext` and records transition metrics in Neon Postgres `sla_logs`.
 */

import React from 'react'
import { Task, TaskStatus } from '@/types'
import { useTasks } from '@/context/TaskContext'
import { TaskCard } from '../TaskCard'

interface Props {
  onEdit: (task: Task) => void
}

export const KanbanView: React.FC<Props> = ({ onEdit }) => {
  const { filteredTasks, moveTaskStatus } = useTasks()

  // Column definitions mapping to the 3 canonical workflow statuses
  const columns: { status: TaskStatus; title: string; color: string; border: string }[] = [
    { status: 'To Do', title: 'To Do', color: 'bg-slate-100 text-slate-800', border: 'border-slate-300' },
    { status: 'In Progress', title: 'In Progress', color: 'bg-indigo-50 text-indigo-800', border: 'border-indigo-300' },
    { status: 'Done', title: 'Done', color: 'bg-emerald-50 text-emerald-800', border: 'border-emerald-300' },
  ]

  /**
   * handleDragOver
   * --------------------------------------------------------------------------
   * Required by HTML5 Drag and Drop standard: Calling `preventDefault()` notifies
   * the browser that this element is a valid drop target.
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  /**
   * handleDrop
   * --------------------------------------------------------------------------
   * Extracts the task ID transferred during drag start and executes stage change.
   */
  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId) {
      moveTaskStatus(taskId, targetStatus)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((col) => {
        // Filter tasks that belong to this column
        const columnTasks = filteredTasks.filter((t) => t.status === col.status)
        return (
          <div
            key={col.status}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.status)}
            className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.border.replace('border', 'bg')}`} />
                <h3 className="text-sm font-bold text-slate-800">{col.title}</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700">
                {columnTasks.length}
              </span>
            </div>

            {/* Draggable Task List */}
            <div className="flex-1 space-y-3">
              {columnTasks.length === 0 ? (
                // Dashed drop zone indicator when column is empty
                <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400">
                  Drop tasks here
                </div>
              ) : (
                columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <TaskCard task={task} onEdit={onEdit} />
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

