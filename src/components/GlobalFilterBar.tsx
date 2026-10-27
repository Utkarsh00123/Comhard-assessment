'use client'

/**
 * ============================================================================
 * GLOBAL FILTER & VIEW SWITCHER BAR (GlobalFilterBar.tsx)
 * ============================================================================
 * HOW IT WORKS:
 * Provides a responsive control toolbar above the task boards.
 * 
 * CORE CAPABILITIES:
 * 1. View Mode Switching: Toggles between 'list', 'grid', 'kanban', and 'section'.
 * 2. Multi-Select Importance Filters: Allows filtering by any combination of High, Medium, Low.
 * 3. Substring Search: Live text input that matches task titles or descriptions.
 * 4. Date Sorting: Sorts by Due Date or Creation Date (Ascending / Descending).
 * 5. Category Dropdown: Filters tasks by dynamic categories extracted from current inventory.
 * 6. Quick Task Creation: Modal launcher button.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Mutates the centralized `filter` state inside `TaskContext.tsx`.
 * - Automatically cascades down to whatever view mode is active, ensuring 100% filter
 *   consistency regardless of layout.
 */

import React from 'react'
import { useTasks } from '@/context/TaskContext'
import { TaskImportance } from '@/types'
import { Search, Plus, Filter, LayoutList, LayoutGrid, Kanban, Folder } from 'lucide-react'

interface Props {
  activeView: 'list' | 'grid' | 'kanban' | 'section'
  onViewChange: (view: 'list' | 'grid' | 'kanban' | 'section') => void
  onOpenCreateModal: () => void
}

export const GlobalFilterBar: React.FC<Props> = ({
  activeView,
  onViewChange,
  onOpenCreateModal,
}) => {
  const { filter, setFilter, categories } = useTasks()

  const importanceOptions: TaskImportance[] = ['High', 'Medium', 'Low']

  /**
   * toggleImportance
   * --------------------------------------------------------------------------
   * HOW IT WORKS:
   * Multi-select toggle handler. If priority already exists in `filter.importance`,
   * it removes it; otherwise, it appends it.
   */
  const toggleImportance = (imp: TaskImportance) => {
    setFilter((prev) => {
      const exists = prev.importance.includes(imp)
      const nextImportance = exists
        ? prev.importance.filter((i) => i !== imp)
        : [...prev.importance, imp]
      return { ...prev, importance: nextImportance }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs mb-6 space-y-4">
      {/* Top row: View Mode Switcher and Create Task action button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* View Switcher Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => onViewChange('list')}
            className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === 'list'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5 mr-1.5" />
            List View
          </button>
          <button
            onClick={() => onViewChange('grid')}
            className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === 'grid'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
            Grid View
          </button>
          <button
            onClick={() => onViewChange('kanban')}
            className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === 'kanban'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Kanban className="w-3.5 h-3.5 mr-1.5" />
            Kanban View
          </button>
          <button
            onClick={() => onViewChange('section')}
            className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === 'section'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Folder className="w-3.5 h-3.5 mr-1.5" />
            Section View
          </button>
        </div>

        {/* Primary Action Button to Open Task Creation Modal */}
        <button
          onClick={onOpenCreateModal}
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs hover:shadow transition-all"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Task
        </button>
      </div>

      {/* Bottom row: Multi-dimensional Filtering Controls */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
        {/* Real-time Substring Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={filter.searchQuery}
            onChange={(e) => setFilter((prev) => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        {/* Multi-select Importance Buttons */}
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-medium text-slate-500 flex items-center">
            <Filter className="w-3 h-3 mr-1" />
            Importance:
          </span>
          {importanceOptions.map((imp) => {
            const isSelected = filter.importance.includes(imp)
            return (
              <button
                key={imp}
                onClick={() => toggleImportance(imp)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  isSelected
                    ? imp === 'High'
                      ? 'bg-red-600 text-white border-red-600'
                      : imp === 'Medium'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {imp}
              </button>
            )
          })}
          {filter.importance.length > 0 && (
            <button
              onClick={() => setFilter((prev) => ({ ...prev, importance: [] }))}
              className="text-xs text-slate-400 hover:text-slate-600 underline ml-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Date Sorting Order Dropdown */}
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-medium text-slate-500">Date Sort:</span>
          <select
            value={filter.dateSort}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, dateSort: e.target.value as any }))
            }
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="created_at_desc">Creation Date (Newest first)</option>
            <option value="created_at_asc">Creation Date (Oldest first)</option>
            <option value="due_date_asc">Due Date (Earliest first)</option>
            <option value="due_date_desc">Due Date (Latest first)</option>
          </select>
        </div>

        {/* Category Filter Dropdown */}
        {categories.length > 0 && (
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-medium text-slate-500">Category:</span>
            <select
              value={filter.category}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, category: e.target.value }))
              }
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}

