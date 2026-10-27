import { neon } from '@neondatabase/serverless'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.warn('DATABASE_URL is not set in environment variables.')
}

export const getDb = () => {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL environment variable is missing.')
  }
  return neon(url)
}

export const sql = neon(process.env.DATABASE_URL || '')
