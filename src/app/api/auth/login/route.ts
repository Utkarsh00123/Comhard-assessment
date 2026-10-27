/**
 * ============================================================================
 * POST /api/auth/login - USER AUTHENTICATION ENDPOINT
 * ============================================================================
 * HOW IT WORKS:
 * 1. Parses JSON body to extract `email` and `password`.
 * 2. Queries Neon Postgres `users` table for a record matching the normalized email.
 * 3. Uses `bcrypt.compare` to verify the plaintext password against the stored hash.
 * 4. If credentials match, generates a signed JWT token valid for 7 days.
 * 5. Returns `{ token, user }` JSON response with HTTP 200.
 * 
 * WHERE ITS EFFECTS LEAD:
 * - On success: Frontend stores JWT in localStorage, sets active user in AuthContext,
 *   and transitions the user into the main task dashboard.
 * - On failure: Returns HTTP 401 with generic error message, protecting against
 *   user enumeration attacks.
 */

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'
import { signJwt } from '@/lib/jwt'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // 1. Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const sql = getDb()

    // 2. Fetch user record by normalized email
    const users = await sql`
      SELECT id, email, password_hash, name FROM users 
      WHERE email = ${email.toLowerCase().trim()} 
      LIMIT 1
    `

    // If no user exists with this email, return 401 Unauthorized
    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const user = users[0]

    // 3. Cryptographically compare submitted password against stored bcrypt hash
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // 4. Generate signed JWT session token
    const token = signJwt({
      userId: user.id,
      email: user.email,
    })

    // 5. Send back authorization token and sanitized user profile
    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (err: any) {
    console.error('Login error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

