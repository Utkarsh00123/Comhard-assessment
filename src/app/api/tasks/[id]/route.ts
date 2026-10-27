import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/jwt'
import { mapDbTask } from '../route'


export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthUserFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: taskId } = await params
    const body = await request.json()
    const { title, description, category, status, importance, dueDate } = body

    const sql = getDb()

    // 1. Fetch current task to verify ownership and previous state
    const existing = await sql`
      SELECT * FROM tasks WHERE id = ${taskId} AND user_id = ${auth.userId} LIMIT 1
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const currentTask = existing[0]
    const now = new Date()

    let newStatus = currentTask.status
    let newTimeInTodo = Number(currentTask.time_in_todo_seconds || 0)
    let newTimeInProgress = Number(currentTask.time_in_progress_seconds || 0)
    let newStageTransitionsCount = Number(currentTask.stage_transitions_count || 0)
    let newStageEnteredAt = currentTask.current_stage_entered_at

    // 2. SLA Engine Logic: Status Transition Handling
    if (status && status !== currentTask.status && ['To Do', 'In Progress', 'Done'].includes(status)) {
      const prevStatus = currentTask.status
      newStatus = status
      newStageTransitionsCount += 1

      // Calculate exact elapsed seconds in previous section
      const enteredAt = new Date(currentTask.current_stage_entered_at).getTime()
      const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - enteredAt) / 1000))

      if (prevStatus === 'To Do') {
        newTimeInTodo += elapsedSeconds
      } else if (prevStatus === 'In Progress') {
        newTimeInProgress += elapsedSeconds
      }
      // Note: If prevStatus === 'Done', SLA is strictly 0, so no time accumulated.

      newStageEnteredAt = now.toISOString()

      // Record in SLA logs table
      await sql`
        INSERT INTO sla_logs (task_id, user_id, from_status, to_status, seconds_spent, timestamp)
        VALUES (${taskId}, ${auth.userId}, ${prevStatus}, ${newStatus}, ${elapsedSeconds}, ${now.toISOString()})
      `
    }

    const updatedTitle = title !== undefined ? title.trim() : currentTask.title
    const updatedDescription = description !== undefined ? description.trim() : currentTask.description
    const updatedCategory = category !== undefined ? category.trim() : currentTask.category
    const updatedImportance = importance !== undefined ? importance : currentTask.importance
    const updatedDueDate = dueDate !== undefined ? new Date(dueDate).toISOString() : currentTask.due_date

    // 3. Update the task
    const [updatedRow] = await sql`
      UPDATE tasks
      SET 
        title = ${updatedTitle},
        description = ${updatedDescription},
        category = ${updatedCategory},
        status = ${newStatus},
        importance = ${updatedImportance},
        due_date = ${updatedDueDate},
        time_in_todo_seconds = ${newTimeInTodo},
        time_in_progress_seconds = ${newTimeInProgress},
        stage_transitions_count = ${newStageTransitionsCount},
        current_stage_entered_at = ${newStageEnteredAt}
      WHERE id = ${taskId} AND user_id = ${auth.userId}
      RETURNING *
    `

    return NextResponse.json({
      message: 'Task updated successfully',
      task: mapDbTask(updatedRow),
    })
  } catch (err: any) {
    console.error('Update task error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthUserFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: taskId } = await params
    const sql = getDb()

    const deleted = await sql`
      DELETE FROM tasks WHERE id = ${taskId} AND user_id = ${auth.userId} RETURNING id
    `

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Task deleted successfully', id: taskId })
  } catch (err: any) {
    console.error('Delete task error:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to delete task' },
      { status: 500 }
    )
  }
}
