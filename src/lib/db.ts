/**
 * ============================================================================
 * NEON POSTGRESQL DATABASE CLIENT
 * ============================================================================
 * This module configures and exports the database connection client using
 * '@neondatabase/serverless'.
 * 
 * HOW IT WORKS:
 * Neon Serverless driver establishes low-latency, HTTP/WebSocket-based connections
 * to Postgres directly from serverless edge or Node.js runtimes. Unlike traditional
 * node-postgres pools that maintain persistent TCP state, Neon driver executes queries
 * through optimized serverless fetch tunnels, avoiding connection exhaustion.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Used by all API routes:
 *   * /api/auth/login and /api/auth/signup (user records & bcrypt hashes)
 *   * /api/auth/me (user session validation)
 *   * /api/auth/forgot-password (reset token updates)
 *   * /api/tasks and /api/tasks/[id] (task CRUD & SLA transition logs)
 * - Directly persists data into the cloud-hosted Neon Postgres instance.
 */

import { neon } from '@neondatabase/serverless'

// Read the connection string from environment variables (.env.local or production secrets)
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.warn('DATABASE_URL is not set in environment variables. Database queries will fail.')
}

/**
 * getDb
 * ----------------------------------------------------------------------------
 * HOW IT WORKS:
 * Dynamically retrieves the active DATABASE_URL and creates a Neon SQL query client.
 * Throws a clear descriptive error if the environment variable is not defined.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Invoked inside API request handlers on each incoming request.
 * - Provides a safe template-literal tag (e.g. `sql`SELECT * FROM tasks WHERE...``)
 *   that automatically parameterizes values to prevent SQL injection vulnerabilities.
 * 
 * @returns {NeonQueryFunction} Tagged template function for executing SQL queries
 */
export const getDb = () => {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL environment variable is missing. Please configure it in .env.local.')
  }
  return neon(url)
}

/**
 * Default SQL tagged template instance for static/utility imports.
 */
export const sql = neon(process.env.DATABASE_URL || '')

