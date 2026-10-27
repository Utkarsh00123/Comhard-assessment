'use client'

import React from 'react'
import { Task } from '@/types'
import { useTasks } from '@/context/TaskContext'
import { TaskCard } from '../TaskCard'

interface Props {
  onEdit: (task: Task) => void
}

export const GridView: React.FC<Props> = ({ onEdit }) => {
  const { filteredTasks } = useTasks()

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
