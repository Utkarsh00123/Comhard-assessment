/**
 * ============================================================================
 * DATABASE INITIALIZATION & MIGRATION SCRIPT (init-db.mjs)
 * ============================================================================
 * HOW IT WORKS:
 * Connects directly to Neon PostgreSQL using `@neondatabase/serverless` and runs
 * idempotent DDL statements (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`)
 * to establish the production relational schema.
 * 
 * TABLES CREATED:
 * 1. `users`: Stores user accounts, bcrypt password hashes, and recovery tokens.
 * 2. `tasks`: Stores task items, deadlines, priorities, and SLA tracking metrics.
 * 3. `sla_logs`: Stores immutable transition history when tasks change status.
 * 4. Indexes: High-speed B-Tree indexes on foreign keys, status filters, and due dates.
 * 
 * USAGE:
 * node scripts/init-db.mjs
 */

import { neon } from '@neondatabase/serverless'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is not defined in environment.')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function main() {
  console.log('Connecting to Neon Database and running schema setup...')

  // 1. Users table: Central identity store
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      reset_token VARCHAR(255),
      reset_token_expiry TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `
  console.log('✓ Users table ready')

  // 2. Tasks table: Core domain entity with SLA tracking attributes
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT DEFAULT '',
      category VARCHAR(100) DEFAULT 'General',
      status VARCHAR(50) NOT NULL DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Done')),
      importance VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (importance IN ('High', 'Medium', 'Low')),
      due_date TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      current_stage_entered_at TIMESTAMPTZ DEFAULT NOW(),
      time_in_todo_seconds BIGINT DEFAULT 0,
      time_in_progress_seconds BIGINT DEFAULT 0,
      stage_transitions_count INT DEFAULT 0
    );
  `
  console.log('✓ Tasks table ready')

  // 3. SLA logs table: Immutable transition audit log
  await sql`
    CREATE TABLE IF NOT EXISTS sla_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      from_status VARCHAR(50),
      to_status VARCHAR(50) NOT NULL,
      seconds_spent BIGINT NOT NULL DEFAULT 0,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );
  `
  console.log('✓ SLA logs table ready')

  // 4. Create Indexes for query performance & rapid lookups
  await sql`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);`
  await sql`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);`
  await sql`CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);`
  await sql`CREATE INDEX IF NOT EXISTS idx_sla_logs_task_id ON sla_logs(task_id);`
  console.log('✓ Database indexes ready')

  console.log('Database initialized successfully!')
}

main().catch((err) => {
  console.error('Database initialization failed:', err)
  process.exit(1)
})

