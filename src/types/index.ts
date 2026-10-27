export type TaskStatus = 'To Do' | 'In Progress' | 'Done'
export type TaskImportance = 'High' | 'Medium' | 'Low'

export interface User {
  id: string
  email: string
  name: string
  createdAt?: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  status: TaskStatus
  importance: TaskImportance
  dueDate: string
  createdAt: string
  currentStageEnteredAt: string
  timeInTodoSeconds: number
  timeInProgressSeconds: number
  stageTransitionsCount: number
}

export interface TaskFilterState {
  importance: TaskImportance[]
  dateSort: 'due_date_asc' | 'due_date_desc' | 'created_at_desc' | 'created_at_asc'
  category: string
  searchQuery: string
}

export interface SLAMetrics {
  timeInCurrentSectionSeconds: number
  totalCumulativeTimeSeconds: number
  averageSLAPerTransitionSeconds: number
}
