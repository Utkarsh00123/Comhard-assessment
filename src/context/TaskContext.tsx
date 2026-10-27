'use client'

/**
 * ============================================================================
 * TASK CONTEXT & REAL-TIME SLA ENGINE (TaskContext)
 * ============================================================================
 * This context is the central nerve center for the task management application.
 * 
 * CORE RESPONSIBILITIES:
 * 1. Single Source of Truth: Holds the master `tasks` array in React state.
 * 2. CRUD Operations: Provides `createTask`, `updateTask`, `moveTaskStatus`, and `deleteTask`.
 * 3. SLA Tracking Engine: Implements the specification rules for forward-moving SLA timers,
 *    live active section elapsed time, and completion zeroing.
 * 4. Real-Time Heartbeat: Runs a 1000ms tick (`nowTimestamp`) to refresh active timers live.
 * 5. Global Filtering & Sorting: Computes `filteredTasks` based on multi-select priorities,
 *    category dropdowns, search substrings, and date sorting orders.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - All 4 views (ListView, GridView, KanbanView, SectionView) consume `filteredTasks`
 *   to render matching cards/rows consistently.
 * - `SLAMetricsBar` displays the overall portfolio statistics computed by `overallSLAMetrics`.
 * - Changes automatically synchronize with Neon PostgreSQL via REST API routes.
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { Task, TaskImportance, TaskStatus, TaskFilterState, SLAMetrics } from '@/types'
import { useAuth } from './AuthContext'

/**
 * Interface defining the API surface exposed by TaskContext.
 */
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

/**
 * TaskProvider Component
 * ----------------------------------------------------------------------------
 * Wraps the app and provides the task store and SLA calculations.
 */
export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, getAuthHeaders } = useAuth()
  
  // Master list of tasks retrieved from database
  const [tasks, setTasks] = useState<Task[]>([])
  // Loading indicator for asynchronous network requests
  const [isLoading, setIsLoading] = useState(false)
  // Stores error messages if API requests fail
  const [error, setError] = useState<string | null>(null)
  // Unix timestamp (ms) that increments every 1000ms to drive active timer displays
  const [nowTimestamp, setNowTimestamp] = useState(0)

  // Global multi-dimensional filter state
  const [filter, setFilter] = useState<TaskFilterState>({
    importance: [],
    dateSort: 'created_at_desc',
    category: 'all',
    searchQuery: '',
  })

  /**
   * Real-Time SLA Heartbeat
   * --------------------------------------------------------------------------
   * HOW IT WORKS:
   * Sets up an interval that updates `nowTimestamp` every second (1000ms).
   * 
   * WHERE ITS EFFECTS LEAD:
   * - Triggers re-computation of active section SLA timers for incomplete tasks
   *   ('To Do' and 'In Progress') so users see live ticking clocks without
   *   making polling network requests to the database.
   */
  useEffect(() => {
    setNowTimestamp(Date.now())
    const timer = setInterval(() => {
      setNowTimestamp(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  /**
   * fetchTasks
   * --------------------------------------------------------------------------
   * HOW IT WORKS:
   * Issues GET `/api/tasks` using the user's Bearer authentication headers.
   * Parses the JSON response and stores the array into `tasks` state.
   * 
   * WHERE ITS EFFECTS LEAD:
   * - Initializes the dashboard with the user's tasks upon login or page refresh.
   * - Clears tasks when the user logs out.
   */
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

  // Automatically fetch tasks whenever the authenticated user changes
  useEffect(() => {
    if (user) {
      fetchTasks()
    } else {
      setTasks([])
    }
  }, [user])

  /**
   * createTask
   * --------------------------------------------------------------------------
   * HOW IT WORKS:
   * Sends POST `/api/tasks` with new task payload.
   * If successful, prepends the newly created task to local `tasks` array.
   * 
   * WHERE ITS EFFECTS LEAD:
   * - Immediately inserts the new task into all views without needing a full reload.
   * - Saves the task permanently into Neon PostgreSQL.
   * 
   * @param {Partial<Task>} data - Form inputs (title, description, category, importance, dueDate)
   * @returns {Promise<{ error?: string }>} Result object
   */
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

  /**
   * updateTask
   * --------------------------------------------------------------------------
   * HOW IT WORKS:
   * Sends PATCH `/api/tasks/[id]` with modified fields.
   * Updates the corresponding item in the local `tasks` state array.
   * 
   * WHERE ITS EFFECTS LEAD:
   * - If status changed, triggers the server-side SLA transition logic.
   * - Immediately updates the UI with fresh timestamps and metrics from DB.
   * 
   * @param {string} id - UUID of task to update
   * @param {Partial<Task>} data - Fields to update
   * @returns {Promise<{ error?: string }>}
   */
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

  /**
   * moveTaskStatus
   * --------------------------------------------------------------------------
   * HOW IT WORKS:
   * Convenience wrapper around `updateTask` specifically for workflow transitions
   * (e.g. dragging cards in Kanban or clicking stage movement arrows).
   * 
   * @param {string} id - Task UUID
   * @param {TaskStatus} newStatus - Target workflow status ('To Do', 'In Progress', 'Done')
   */
  const moveTaskStatus = async (id: string, newStatus: TaskStatus) => {
    return updateTask(id, { status: newStatus })
  }

  /**
   * deleteTask
   * --------------------------------------------------------------------------
   * HOW IT WORKS:
   * Sends DELETE `/api/tasks/[id]`.
   * On success, filters the deleted task out of the local `tasks` array.
   * 
   * WHERE ITS EFFECTS LEAD:
   * - Removes record and associated SLA logs (via CASCADE) in database.
   * - Card/row instantly disappears from UI.
   * 
   * @param {string} id - UUID of task to remove
   * @returns {Promise<{ error?: string }>}
   */
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

  /**
   * calculateTaskSLAMetrics
   * --------------------------------------------------------------------------
   * HOW IT WORKS (Per Specification Rules):
   * 1. Active Section Tracking:
   *    Calculates exact elapsed seconds in current stage: `Math.floor((nowTimestamp - currentStageEnteredAt) / 1000)`.
   * 2. Completion Zeroing:
   *    When a task is 'Done', the active section SLA is STRICTLY 0. Its active clock permanently stops.
   * 3. Forward Movement SLA:
   *    If moved backward (e.g. In Progress -> To Do), historical time remains intact, and
   *    accumulates on the active section. The total lifecycle SLA always moves forward.
   * 4. Average SLA:
   *    `totalCumulativeTime / stageTransitionsCount`.
   * 
   * WHERE ITS EFFECTS LEAD:
   * - Powers the live timers displayed on every task card and table row.
   * - Feeds into the overall aggregate dashboard metrics.
   * 
   * @param {Task} task - The task record to evaluate
   * @returns {SLAMetrics} Live metrics object
   */
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

    // In Progress stage
    const currentSectionTime = task.timeInProgressSeconds + activeElapsed
    const totalTime = task.timeInTodoSeconds + currentSectionTime
    const avg = totalTime / Math.max(1, task.stageTransitionsCount)
    return {
      timeInCurrentSectionSeconds: currentSectionTime,
      totalCumulativeTimeSeconds: totalTime,
      averageSLAPerTransitionSeconds: Math.round(avg),
    }
  }

  /**
   * categories Memo
   * --------------------------------------------------------------------------
   * Extracts distinct non-empty category names from current tasks.
   * Populates filter dropdowns, category suggestions, and SectionView accordions.
   */
  const categories = useMemo(() => {
    const cats = new Set<string>()
    tasks.forEach((t) => {
      if (t.category) cats.add(t.category)
    })
    return Array.from(cats)
  }, [tasks])

  /**
   * filteredTasks Memo
   * --------------------------------------------------------------------------
   * HOW IT WORKS:
   * Evaluates the master `tasks` array against all active filter criteria:
   * 1. Importance (multi-select match)
   * 2. Category ('all' or specific name)
   * 3. Search Query (case-insensitive substring match in title or description)
   * 4. Date Sorting (due date asc/desc, or created_at asc/desc)
   * 
   * WHERE ITS EFFECTS LEAD:
   * - Consumed by ListView, GridView, KanbanView, and SectionView so that all views
   *   display identical, synchronized filtered data.
   */
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

      // Search query filter
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

  /**
   * overallSLAMetrics Memo
   * --------------------------------------------------------------------------
   * Computes aggregate SLA metrics across the user's entire task inventory.
   * Feeds the top SLA Dashboard Bar with total cumulative lifecycle duration
   * and average transition time.
   */
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

/**
 * useTasks Hook
 * ----------------------------------------------------------------------------
 * Custom hook to safely consume the TaskContext in child components.
 */
export const useTasks = () => {
  const context = useContext(TaskContext)
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider')
  }
  return context
}

