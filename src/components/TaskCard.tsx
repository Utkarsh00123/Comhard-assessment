'use client'

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
  const metrics = calculateTaskSLAMetrics(task)

  const isDone = task.status === 'Done'

  const handleToggleDone = () => {
    if (isDone) {
      moveTaskStatus(task.id, 'To Do')
    } else {
      moveTaskStatus(task.id, 'Done')
    }
  }

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

        {/* Badges row */}
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

        {/* SLA Bar in Card */}
        <div className="mt-3 bg-[#F6F7F4] rounded-xl p-2.5 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-[11px] flex items-center">
              <Clock className="w-3 h-3 mr-1 text-slate-400" />
              Active in section:
            </span>
            <span className="font-mono font-bold text-slate-800">
              {isDone ? (
                <span className="text-emerald-600">0s (Done)</span>
              ) : (
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

      {/* Stage actions */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {task.status}
        </span>
        <div className="flex items-center space-x-1">
          {task.status === 'In Progress' && (
            <button
              onClick={() => moveTaskStatus(task.id, 'To Do')}
              className="p-1 text-slate-400 hover:text-slate-800"
              title="Move backward to To Do"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
          {task.status === 'To Do' && (
            <button
              onClick={() => moveTaskStatus(task.id, 'In Progress')}
              className="p-1 text-slate-400 hover:text-indigo-600"
              title="Move to In Progress"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {task.status === 'In Progress' && (
            <button
              onClick={() => moveTaskStatus(task.id, 'Done')}
              className="p-1 text-slate-400 hover:text-emerald-600"
              title="Mark Done"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onEdit(task)}
            className="p-1 text-slate-400 hover:text-blue-600"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
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
