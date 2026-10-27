'use client'

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { Task, TaskImportance, TaskStatus, TaskFilterState, SLAMetrics } from '@/types'
import { useAuth } from './AuthContext'

interface TaskContextType {
  tasks: Task[]
  filteredTasks: Task[]
  isLoading: boolean
  error: string | null
  filter: TaskFilterState
  setFilter: React.Dispatch<React.SetStateAction<TaskFilterState>>
  createTask: (data: Partial<Task>) => Promise<{ error?: string }>
  updateTask: (id: string, data: Partial<Task>) => Promise<{ error?: string }>
  deleteTask: (id: string) => Promise<{ error?: string }>
  moveTaskStatus: (id: string, newStatus: TaskStatus) => Promise<{ error?: string }>
  calculateTaskSLAMetrics: (task: Task) => SLAMetrics
  overallSLAMetrics: SLAMetrics
  refreshTasks: () => Promise<void>
  categories: string[]
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, getAuthHeaders } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nowTimestamp, setNowTimestamp] = useState(0)

  // Global filters
  const [filter, setFilter] = useState<TaskFilterState>({
    importance: [],
    dateSort: 'created_at_desc',
    category: 'all',
    searchQuery: '',
  })

  // Live timer tick every 1000ms for dynamic active SLA display
  useEffect(() => {
    setNowTimestamp(Date.now())
    const timer = setInterval(() => {
      setNowTimestamp(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchTasks = async () => {
    if (!user) {
      setTasks([])
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/tasks', {
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        throw new Error('Failed to load tasks')
      }
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (err: any) {
      setError(err.message || 'Error fetching tasks')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchTasks()
    } else {
      setTasks([])
    }
  }, [user])

  const createTask = async (data: Partial<Task>) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        return { error: result.error || 'Failed to create task' }
      }
      setTasks((prev) => [result.task, ...prev])
      return {}
    } catch (err: any) {
      return { error: err.message || 'Failed to create task' }
    }
  }

  const updateTask = async (id: string, data: Partial<Task>) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        return { error: result.error || 'Failed to update task' }
      }
      setTasks((prev) => prev.map((t) => (t.id === id ? result.task : t)))
      return {}
    } catch (err: any) {
      return { error: err.message || 'Failed to update task' }
    }
  }

  const moveTaskStatus = async (id: string, newStatus: TaskStatus) => {
    return updateTask(id, { status: newStatus })
  }

  const deleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        const result = await res.json()
        return { error: result.error || 'Failed to delete task' }
      }
      setTasks((prev) => prev.filter((t) => t.id !== id))
      return {}
    } catch (err: any) {
      return { error: err.message || 'Failed to delete task' }
    }
  }

  // SLA Calculation for an individual task per System Specification
  const calculateTaskSLAMetrics = (task: Task): SLAMetrics => {
    const enteredAt = new Date(task.currentStageEnteredAt).getTime()
    const activeElapsed = nowTimestamp > 0 ? Math.max(0, Math.floor((nowTimestamp - enteredAt) / 1000)) : 0

    if (task.status === 'Done') {
      // Per spec: The SLA for the Done stage is always strictly 0. Once entered Done, active timer stops.
      const totalTime = task.timeInTodoSeconds + task.timeInProgressSeconds
      const avg = totalTime / Math.max(1, task.stageTransitionsCount)
      return {
        timeInCurrentSectionSeconds: 0,
        totalCumulativeTimeSeconds: totalTime,
        averageSLAPerTransitionSeconds: Math.round(avg),
      }
    }

    if (task.status === 'To Do') {
      const currentSectionTime = task.timeInTodoSeconds + activeElapsed
      const totalTime = currentSectionTime + task.timeInProgressSeconds
      const avg = totalTime / Math.max(1, task.stageTransitionsCount)
      return {
        timeInCurrentSectionSeconds: currentSectionTime,
        totalCumulativeTimeSeconds: totalTime,
        averageSLAPerTransitionSeconds: Math.round(avg),
      }
    }

    // In Progress
    const currentSectionTime = task.timeInProgressSeconds + activeElapsed
    const totalTime = task.timeInTodoSeconds + currentSectionTime
    const avg = totalTime / Math.max(1, task.stageTransitionsCount)
    return {
      timeInCurrentSectionSeconds: currentSectionTime,
      totalCumulativeTimeSeconds: totalTime,
      averageSLAPerTransitionSeconds: Math.round(avg),
    }
  }

  // Extract unique categories for Section view & filtering
  const categories = useMemo(() => {
    const cats = new Set<string>()
    tasks.forEach((t) => {
      if (t.category) cats.add(t.category)
    })
    return Array.from(cats)
  }, [tasks])

  // Filtered tasks consuming single source of truth array
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Importance filter (multi-select)
      if (filter.importance.length > 0 && !filter.importance.includes(task.importance)) {
        return false
      }

      // Category filter
      if (filter.category !== 'all' && task.category !== filter.category) {
        return false
      }

      // Search query
      if (filter.searchQuery.trim()) {
        const query = filter.searchQuery.toLowerCase()
        const matchTitle = task.title.toLowerCase().includes(query)
        const matchDesc = task.description?.toLowerCase().includes(query)
        if (!matchTitle && !matchDesc) return false
      }

      return true
    }).sort((a, b) => {
      if (filter.dateSort === 'due_date_asc') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      if (filter.dateSort === 'due_date_desc') {
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
      }
      if (filter.dateSort === 'created_at_asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      // default: created_at_desc
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [tasks, filter])

  // Aggregate SLA Metrics across all tasks
  const overallSLAMetrics = useMemo(() => {
    if (tasks.length === 0) {
      return {
        timeInCurrentSectionSeconds: 0,
        totalCumulativeTimeSeconds: 0,
        averageSLAPerTransitionSeconds: 0,
      }
    }

    let totalCumulative = 0
    let totalTransitions = 0

    tasks.forEach((task) => {
      const m = calculateTaskSLAMetrics(task)
      totalCumulative += m.totalCumulativeTimeSeconds
      totalTransitions += task.stageTransitionsCount
    })

    return {
      timeInCurrentSectionSeconds: 0,
      totalCumulativeTimeSeconds: totalCumulative,
      averageSLAPerTransitionSeconds: Math.round(totalCumulative / Math.max(1, totalTransitions)),
    }
  }, [tasks, nowTimestamp])

  return (
    <TaskContext.Provider
      value={{
        tasks,
        filteredTasks,
        isLoading,
        error,
        filter,
        setFilter,
        createTask,
        updateTask,
        deleteTask,
        moveTaskStatus,
        calculateTaskSLAMetrics,
        overallSLAMetrics,
        refreshTasks: fetchTasks,
        categories,
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}

export const useTasks = () => {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider')
  }
  return context
}
