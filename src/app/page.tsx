'use client'

/**
 * ============================================================================
 * MAIN DASHBOARD PAGE (app/page.tsx)
 * ============================================================================
 * HOW IT WORKS:
 * Primary split-view application layout adhering to the Stitch minimal design.
 * 
 * CORE ARCHITECTURE:
 * 1. Authentication Protection: Automatically routes unauthenticated visitors to `/login`.
 * 2. Left Navigation Sidebar:
 *    - Search input
 *    - Task Buckets: All Tasks, Due Today, Upcoming
 *    - View Switcher: List, Kanban, Grid, Section
 *    - User Profile & Logout action
 * 3. Main Workspace:
 *    - Header with task counter and live portfolio SLA badges
 *    - Quick importance filter toggles
 *    - Active View Component (ListView, GridView, KanbanView, or SectionView)
 *    - Quick status queues for 'To Do' and 'In Progress'
 * 4. Keyboard Shortcuts: Pressing 'C' on the keyboard immediately opens the task creation modal.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Serves as the central operating environment for the authenticated user.
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTasks } from '@/context/TaskContext'
import { ListView } from '@/components/views/ListView'
import { GridView } from '@/components/views/GridView'
import { KanbanView } from '@/components/views/KanbanView'
import { SectionView } from '@/components/views/SectionView'
import { TaskModal } from '@/components/TaskModal'
import { Task, TaskImportance, TaskStatus } from '@/types'
import { formatDuration } from '@/lib/utils'
import {
  Menu,
  Search,
  CheckSquare,
  LogOut,
  Calendar,
  Grid,
  Kanban,
  List,
  Folder,
  Plus,
  Loader2,
  Clock,
  Activity,
  Layers,
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, logout, isLoading: authLoading } = useAuth()
  const {
    tasks,
    filter,
    setFilter,
    createTask,
    moveTaskStatus,
    overallSLAMetrics,
    categories,
  } = useTasks()

  // Active task category filter (All, Due Today, or Upcoming)
  const [activeTaskFilter, setActiveTaskFilter] = useState<'all' | 'today' | 'upcoming'>('all')
  // Active board view mode
  const [activeView, setActiveView] = useState<'list' | 'grid' | 'kanban' | 'section'>('list')
  // Task creation/edit modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false)
  // Selected task to populate edit modal (null if creating a new task)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
  // Initial status for newly opened create modal
  const [defaultStatusForNew, setDefaultStatusForNew] = useState<TaskStatus>('To Do')

  /**
   * Route Guard
   * --------------------------------------------------------------------------
   * HOW IT WORKS:
   * Once initial auth loading resolves, verifies `user` presence.
   * If null, redirects to `/login`.
   */
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  /**
   * Keyboard Shortcut Listener
   * --------------------------------------------------------------------------
   * HOW IT WORKS:
   * Listens for the 'C' keypress globally (unless currently typing in an input/textarea).
   * Opens the Create Task modal instantly for optimal keyboard-driven ergonomics.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          setTaskToEdit(null)
          setDefaultStatusForNew('To Do')
          setIsModalOpen(true)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Calculate tasks due today based on current calendar date
  const now = new Date()
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.dueDate) return true
      const due = new Date(t.dueDate)
      return (
        due.getDate() === now.getDate() &&
        due.getMonth() === now.getMonth() &&
        due.getFullYear() === now.getFullYear()
      )
    })
  }, [tasks, now])

  // Calculate upcoming tasks with due dates in the future
  const upcomingTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.dueDate) return false
      return new Date(t.dueDate).getTime() > now.getTime()
    })
  }, [tasks, now])

  // Tasks to display based on the selected sidebar time category
  const displayedTasks = useMemo(() => {
    if (activeTaskFilter === 'today') return todayTasks
    if (activeTaskFilter === 'upcoming') return upcomingTasks
    return tasks
  }, [activeTaskFilter, todayTasks, upcomingTasks, tasks])

  // Modal open helper for creating tasks with a preset status
  const handleOpenCreateModal = (status: TaskStatus = 'To Do') => {
    setDefaultStatusForNew(status)
    setTaskToEdit(null)
    setIsModalOpen(true)
  }

  // Modal open helper for editing an existing task
  const handleEditTask = (task: Task) => {
    setTaskToEdit(task)
    setIsModalOpen(true)
  }

  // Toggle priority filter pill
  const toggleImportance = (imp: TaskImportance) => {
    setFilter((prev) => {
      const exists = prev.importance.includes(imp)
      const next = exists ? prev.importance.filter((i) => i !== imp) : [...prev.importance, imp]
      return { ...prev, importance: next }
    })
  }

  // Loading spinner during session validation
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#E8ECE6] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-800 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading your workspace...</p>
      </div>
    )
  }

  // Prevent render if unauthenticated
  if (!user) return null

  return (
    <div className="h-screen w-screen overflow-hidden bg-white text-slate-800 flex flex-col lg:flex-row">
      {/* Left Sidebar */}
      <aside className="w-full lg:w-72 bg-[#F6F7F4] border-r border-[#E8ECE6] p-6 flex flex-col justify-between shrink-0 h-full min-h-0 overflow-y-auto">

          <div className="space-y-6">
            {/* Sidebar Header & Search */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Menu</h2>
                <button
                  aria-label="Toggle navigation"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition"
                  type="button"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E2E6DF] rounded-xl text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 transition"
                  placeholder="Search"
                  type="text"
                  value={filter.searchQuery}
                  onChange={(e) => setFilter((prev) => ({ ...prev, searchQuery: e.target.value }))}
                />
              </div>
            </div>

            {/* TASKS Section */}
            <div className="space-y-6">
              <nav className="space-y-1">
                <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                  TASKS
                </p>
                {/* 1. All Tasks */}
                <button
                  onClick={() => setActiveTaskFilter('all')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-sm transition ${
                    activeTaskFilter === 'all'
                      ? 'bg-white shadow-xs text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span>All Tasks</span>
                  </div>
                  <span className="text-xs bg-slate-200/80 px-2 py-0.5 rounded-md font-semibold text-slate-600">
                    {tasks.length}
                  </span>
                </button>

                {/* 2. Due Today */}
                <button
                  onClick={() => setActiveTaskFilter('today')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-sm transition ${
                    activeTaskFilter === 'today'
                      ? 'bg-white shadow-xs text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckSquare className="w-4 h-4 text-slate-800" />
                    <span>Due Today</span>
                  </div>
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-800">
                    {todayTasks.length}
                  </span>
                </button>

                {/* 3. Upcoming */}
                <button
                  onClick={() => setActiveTaskFilter('upcoming')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium text-sm transition ${
                    activeTaskFilter === 'upcoming'
                      ? 'bg-white shadow-xs text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Upcoming</span>
                  </div>
                  <span className="text-xs bg-slate-200/80 px-2 py-0.5 rounded-md font-semibold text-slate-600">
                    {upcomingTasks.length}
                  </span>
                </button>
              </nav>

              {/* VIEWS Section */}
              <div className="space-y-1">
                <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                  VIEWS
                </p>
                {/* List View */}
                <button
                  onClick={() => setActiveView('list')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition ${
                    activeView === 'list'
                      ? 'bg-white shadow-xs text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-white/80 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <List className="w-4 h-4 text-slate-800" />
                    <span>List</span>
                  </div>
                  {activeView === 'list' && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                      Active
                    </span>
                  )}
                </button>

                {/* Kanban View */}
                <button
                  onClick={() => setActiveView('kanban')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition ${
                    activeView === 'kanban'
                      ? 'bg-white shadow-xs text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-white/80 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Kanban className="w-4 h-4 text-slate-400" />
                    <span>Kanban</span>
                  </div>
                  {activeView === 'kanban' && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                      Active
                    </span>
                  )}
                </button>

                {/* Grid View */}
                <button
                  onClick={() => setActiveView('grid')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition ${
                    activeView === 'grid'
                      ? 'bg-white shadow-xs text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-white/80 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Grid className="w-4 h-4 text-slate-400" />
                    <span>Grid</span>
                  </div>
                  {activeView === 'grid' && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                      Active
                    </span>
                  )}
                </button>

                {/* Section View */}
                <button
                  onClick={() => setActiveView('section')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition ${
                    activeView === 'section'
                      ? 'bg-white shadow-xs text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-white/80 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Folder className="w-4 h-4 text-slate-400" />
                    <span>Section</span>
                  </div>
                  {activeView === 'section' && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                      Active
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Settings & Profile Actions */}
          <div className="pt-6 border-t border-[#E8ECE6] space-y-1">
            <div className="px-3 py-2 text-xs text-slate-500 font-medium flex items-center justify-between">
              <span className="truncate">{user.name || user.email}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Neon DB Connected" />
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-600 hover:bg-white/80 hover:text-red-600 text-sm font-medium transition"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Sign out</span>
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-6 md:p-10 bg-white flex flex-col justify-between h-full min-h-0 overflow-y-auto">
          <div className="space-y-6">
            {/* Title & Counter Header */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
              <header className="flex items-baseline gap-3">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 capitalize">
                  {activeTaskFilter === 'today'
                    ? 'Due Today'
                    : activeTaskFilter === 'upcoming'
                    ? 'Upcoming Tasks'
                    : 'All Tasks'}
                </h1>
                <span className="text-2xl font-bold text-slate-400 font-mono">
                  {displayedTasks.length}
                </span>
              </header>

              {/* SLA Engine Pill Summary */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-[#F6F7F4] border border-[#ECEEE9] px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-500">Cumulative SLA:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatDuration(overallSLAMetrics.totalCumulativeTimeSeconds)}
                  </span>
                </div>
                <div className="bg-[#F6F7F4] border border-[#ECEEE9] px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-slate-500">Avg SLA:</span>
                  <span className="font-mono font-bold text-indigo-600">
                    {formatDuration(overallSLAMetrics.averageSLAPerTransitionSeconds)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Filters Row (Importance & Category) */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400 font-medium">Importance:</span>
              {(['High', 'Medium', 'Low'] as TaskImportance[]).map((imp) => {
                const isSelected = filter.importance.includes(imp)
                return (
                  <button
                    key={imp}
                    onClick={() => toggleImportance(imp)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {imp}
                  </button>
                )
              })}

              {categories.length > 0 && (
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Category:</span>
                  <select
                    value={filter.category}
                    onChange={(e) => setFilter((prev) => ({ ...prev, category: e.target.value }))}
                    className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                  >
                    <option value="all">All</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Quick Add Task Trigger */}
            <div>
              <button
                onClick={() => handleOpenCreateModal('To Do')}
                className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 transition bg-slate-50/50"
                type="button"
              >
                <Plus className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium">Add New Task</span>
              </button>
            </div>

            {/* Active View Display */}
            <section className="space-y-3">
              {activeView === 'list' && <ListView onEdit={handleEditTask} />}
              {activeView === 'grid' && <GridView onEdit={handleEditTask} />}
              {activeView === 'kanban' && <KanbanView onEdit={handleEditTask} />}
              {activeView === 'section' && <SectionView onEdit={handleEditTask} />}
            </section>

            {/* Secondary Section: Tomorrow (To Do) & This Week (In Progress) Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* Box 1: To Do */}
              <div className="p-5 rounded-2xl bg-[#FAFAF8] border border-[#ECEEE9] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-slate-800">To Do Queue</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {tasks.filter((t) => t.status === 'To Do').length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenCreateModal('To Do')}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 mb-3 rounded-xl border border-dashed border-slate-300 text-xs text-slate-400 hover:text-slate-600 transition"
                    type="button"
                  >
                    <span className="font-bold">+</span>
                    <span>Add New Task</span>
                  </button>
                  <div className="space-y-2">
                    {tasks
                      .filter((t) => t.status === 'To Do')
                      .slice(0, 3)
                      .map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-100 text-xs font-medium text-slate-700"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <input
                              type="checkbox"
                              checked={false}
                              onChange={() => moveTaskStatus(t.id, 'Done')}
                              className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-0 border-slate-300 cursor-pointer"
                            />
                            <span className="truncate">{t.title}</span>
                          </div>
                          <button
                            onClick={() => handleEditTask(t)}
                            className="text-slate-300 hover:text-slate-600 px-1"
                          >
                            ›
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Box 2: In Progress */}
              <div className="p-5 rounded-2xl bg-[#FAFAF8] border border-[#ECEEE9] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-slate-800">Active In Progress</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      {tasks.filter((t) => t.status === 'In Progress').length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenCreateModal('In Progress')}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 mb-3 rounded-xl border border-dashed border-slate-300 text-xs text-slate-400 hover:text-slate-600 transition"
                    type="button"
                  >
                    <span className="font-bold">+</span>
                    <span>Add New Task</span>
                  </button>
                  <div className="space-y-2">
                    {tasks
                      .filter((t) => t.status === 'In Progress')
                      .slice(0, 3)
                      .map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-100 text-xs font-medium text-slate-700"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <input
                              type="checkbox"
                              checked={false}
                              onChange={() => moveTaskStatus(t.id, 'Done')}
                              className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-0 border-slate-300 cursor-pointer"
                            />
                            <span className="truncate">{t.title}</span>
                          </div>
                          <button
                            onClick={() => handleEditTask(t)}
                            className="text-slate-300 hover:text-slate-600 px-1"
                          >
                            ›
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <footer className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>
              Press{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">
                C
              </kbd>{' '}
              to add task quickly
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Neon DB Synced
              </span>
            </div>
          </footer>
        </main>

        {/* Task Creation & Edit Modal */}
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          taskToEdit={taskToEdit}
        />
      </div>
    )
  }
