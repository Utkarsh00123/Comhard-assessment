/**
 * ============================================================================
 * POST /api/auth/signup - USER REGISTRATION ENDPOINT
 * ============================================================================
 * HOW IT WORKS:
 * 1. Validates the incoming email and password from the request JSON body.
 * 2. Checks Neon PostgreSQL `users` table to ensure the email is not already registered.
 * 3. Hashes the raw password with `bcryptjs` using 10 salt rounds (never storing plaintext).
 * 4. Inserts the new user record into the database, generating a secure UUID primary key.
 * 5. Generates a signed JWT session token and returns it alongside the safe user profile.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - A new row is permanently persisted in the `users` table.
 * - The frontend receives `{ token, user }`, stores the token in `localStorage`, and
 *   immediately authorizes the user without requiring a separate login step.
 */

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'
import { signJwt } from '@/lib/jwt'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    // 1. Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // 2. Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const sql = getDb()

    // 3. Check for existing account with the same normalized email
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1
    `

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    // 4. Cryptographically hash password before database insertion
    const passwordHash = await bcrypt.hash(password, 10)
    const displayName = name?.trim() || email.split('@')[0]

    // 5. Insert new user into Neon Postgres and return generated ID
    const [newUser] = await sql`
      INSERT INTO users (email, password_hash, name)
      VALUES (${email.toLowerCase().trim()}, ${passwordHash}, ${displayName})
      RETURNING id, email, name, created_at
    `

    // 6. Issue a 7-day signed JWT token for the new user
    const token = signJwt({
      userId: newUser.id,
      email: newUser.email,
    })

    // 7. Return success response (excluding password hash)
    return NextResponse.json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    })
  } catch (err: any) {
    console.error('Signup error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

