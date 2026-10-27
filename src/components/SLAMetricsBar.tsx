'use client'

/**
 * ============================================================================
 * SLA METRICS DASHBOARD BAR (SLAMetricsBar.tsx)
 * ============================================================================
 * HOW IT WORKS:
 * Renders the top-level SLA analytics summary card on the dashboard.
 * 
 * CORE METRICS DISPLAYED:
 * 1. Status Breakdown Counters: Active count of tasks in 'To Do', 'In Progress', and 'Done'.
 * 2. Cumulative SLA: Total forward-moving lifecycle duration accumulated across all tasks.
 * 3. Average SLA per Transition: Average time spent between status handoffs.
 * 4. Done Stage SLA Status: Visually emphasizes the specification rule that active SLA
 *    for completed tasks is strictly 0s.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Updates every 1000ms as active tasks tick in `TaskContext`.
 * - Gives managers and users instant visibility into overall workflow health.
 */

import React from 'react'
import { useTasks } from '@/context/TaskContext'
import { formatDuration } from '@/lib/utils'
import { Clock, TrendingUp, CheckCircle, Activity } from 'lucide-react'

export const SLAMetricsBar: React.FC = () => {
  const { tasks, overallSLAMetrics } = useTasks()

  // Compute status distributions
  const todoCount = tasks.filter((t) => t.status === 'To Do').length
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length
  const doneCount = tasks.filter((t) => t.status === 'Done').length

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs mb-6">
      {/* Top row: Header title and stage counts */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
            SLA Engine Dashboard
          </h2>
        </div>
        <div className="flex items-center space-x-4 text-xs font-medium">
          <span className="text-slate-500">
            To Do: <strong className="text-slate-800">{todoCount}</strong>
          </span>
          <span className="text-indigo-600">
            In Progress: <strong className="text-indigo-900">{inProgressCount}</strong>
          </span>
          <span className="text-emerald-600">
            Done: <strong className="text-emerald-900">{doneCount}</strong>
          </span>
        </div>
      </div>

      {/* Grid of SLA Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Total Active Work Time across all tasks */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Cumulative SLA (Prior to Done)</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {formatDuration(overallSLAMetrics.totalCumulativeTimeSeconds)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Forward-moving lifecycle timer
          </p>
        </div>

        {/* Metric 2: Average SLA per Transition */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Average SLA per Transition</span>
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-indigo-600 font-mono">
            {formatDuration(overallSLAMetrics.averageSLAPerTransitionSeconds)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Total active time / stage moves
          </p>
        </div>

        {/* Metric 3: Active Status Zeroing Rule */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Done Stage SLA Status</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 font-mono">
            Strictly 0s
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Active clock halts permanently upon completion
          </p>
        </div>
      </div>
    </div>
  )
}

