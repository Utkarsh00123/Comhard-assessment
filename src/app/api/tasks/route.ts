/**
 * ============================================================================
 * /api/tasks - TASK COLLECTION ENDPOINTS (GET & POST)
 * ============================================================================
 * This route file handles:
 * 1. GET: Fetching all tasks belonging to the authenticated user.
 * 2. POST: Creating a new task record with initialized SLA tracking fields.
 * 
 * MULTI-TENANT ISOLATION:
 * Every database query strictly filters by `user_id = auth.userId`, guaranteeing
 * that users can never see or modify tasks created by other users.
 */

import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/jwt'

/**
 * mapDbTask
 * ----------------------------------------------------------------------------
 * HOW IT WORKS:
 * Transforms a raw snake_case row from the PostgreSQL `tasks` table into the
 * standardized camelCase `Task` TypeScript interface required by the client.
 * Converts DB timestamps into ISO 8601 strings and casts numeric counters.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Ensures uniform object shapes across the frontend React components.
 * - Prevents NaN errors in SLA duration math by defaulting counters to 0.
 * 
 * @param {any} row - Raw database query row
 * @returns {Task} Cleanly typed Task model
 */
export function mapDbTask(row: any) {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description || '',
    category: row.category || 'General',
    status: row.status,
    importance: row.importance,
    dueDate: new Date(row.due_date).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
    currentStageEnteredAt: new Date(row.current_stage_entered_at).toISOString(),
    timeInTodoSeconds: Number(row.time_in_todo_seconds || 0),
    timeInProgressSeconds: Number(row.time_in_progress_seconds || 0),
    stageTransitionsCount: Number(row.stage_transitions_count || 0),
  }
}

/**
 * GET /api/tasks
 * ----------------------------------------------------------------------------
 * HOW IT WORKS:
 * 1. Verifies Bearer JWT from `Authorization` header.
 * 2. Queries Neon Postgres `tasks` table where `user_id = auth.userId`.
 * 3. Orders results with newest tasks first (`created_at DESC`).
 * 4. Transforms each row via `mapDbTask`.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Feeds the `fetchTasks()` method in `TaskContext.tsx`.
 * - Populates the task board views on initial dashboard load.
 */
export async function GET(request: Request) {
  try {
    const auth = getAuthUserFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sql = getDb()
    const rows = await sql`
      SELECT * FROM tasks 
      WHERE user_id = ${auth.userId}
      ORDER BY created_at DESC
    `

    const tasks = rows.map(mapDbTask)
    return NextResponse.json({ tasks })
  } catch (err: any) {
    console.error('Fetch tasks error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tasks
 * ----------------------------------------------------------------------------
 * HOW IT WORKS:
 * 1. Validates user authentication.
 * 2. Extracts `title`, `description`, `category`, `status`, `importance`, and `dueDate`.
 * 3. Enforces sensible defaults:
 *    - Status defaults to 'To Do'
 *    - Importance defaults to 'Medium'
 *    - Due Date defaults to 7 days from now if not provided
 * 4. Sets initial SLA tracking fields:
 *    - `current_stage_entered_at`: current timestamp
 *    - `time_in_todo_seconds`: 0
 *    - `time_in_progress_seconds`: 0
 *    - `stage_transitions_count`: 0
 * 5. Inserts the record into Neon Postgres and returns the mapped task.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - New task is saved permanently in the database.
 * - Added to `TaskContext` state array, instantly rendering in all 4 dashboard views.
 */
export async function POST(request: Request) {
  try {
    const auth = getAuthUserFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, category, status, importance, dueDate } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const taskStatus = status && ['To Do', 'In Progress', 'Done'].includes(status) ? status : 'To Do'
    const taskImportance = importance && ['High', 'Medium', 'Low'].includes(importance) ? importance : 'Medium'
    const taskDueDate = dueDate ? new Date(dueDate).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString()
    const taskCategory = category?.trim() || 'General'

    const sql = getDb()
    const now = new Date().toISOString()

    const [newTask] = await sql`
      INSERT INTO tasks (
        user_id,
        title,
        description,
        category,
        status,
        importance,
        due_date,
        created_at,
        current_stage_entered_at,
        time_in_todo_seconds,
        time_in_progress_seconds,
        stage_transitions_count
      )
      VALUES (
        ${auth.userId},
        ${title.trim()},
        ${description?.trim() || ''},
        ${taskCategory},
        ${taskStatus},
        ${taskImportance},
        ${taskDueDate},
        ${now},
        ${now},
        0,
        0,
        0
      )
      RETURNING *
    `

    return NextResponse.json({
      message: 'Task created successfully',
      task: mapDbTask(newTask),
    })
  } catch (err: any) {
    console.error('Create task error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to create task' },
      { status: 500 }
    )
  }
}

