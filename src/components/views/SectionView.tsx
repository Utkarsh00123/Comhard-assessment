'use client'

import React, { useState } from 'react'
import { Task } from '@/types'
import { useTasks } from '@/context/TaskContext'
import { TaskCard } from '../TaskCard'
import { ChevronDown, ChevronRight, Folder } from 'lucide-react'

interface Props {
  onEdit: (task: Task) => void
}

export const SectionView: React.FC<Props> = ({ onEdit }) => {
  const { filteredTasks } = useTasks()

  // Group tasks by category
  const groupedTasks = React.useMemo(() => {
    const groups: Record<string, Task[]> = {}
    filteredTasks.forEach((task) => {
      const cat = task.category || 'General'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(task)
    })
    return groups
  }, [filteredTasks])

  // Track expanded state for accordions (all open by default)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (category: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  const categories = Object.keys(groupedTasks)

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-slate-500 text-sm">No tasks match the active filters.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const tasksInSection = groupedTasks[category]
        const isCollapsed = collapsedSections[category]

        return (
          <div
            key={category}
            className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all"
          >
            {/* Accordion Section Header */}
            <button
              onClick={() => toggleSection(category)}
              className="w-full px-5 py-3.5 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between transition-colors border-b border-slate-200/60"
            >
              <div className="flex items-center space-x-2">
                <Folder className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">{category}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold ml-2">
                  {tasksInSection.length}
                </span>
              </div>
              <div className="text-slate-400">
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {/* Accordion Content */}
            {!isCollapsed && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/30">
                {tasksInSection.map((task) => (
                  <TaskCard key={task.id} task={task} onEdit={onEdit} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
