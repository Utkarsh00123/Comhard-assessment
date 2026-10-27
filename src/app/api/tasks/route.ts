import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/jwt'


// Helper to format DB task to Task interface
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
