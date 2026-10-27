/**
 * ============================================================================
 * GET /api/auth/me - SESSION VERIFICATION ENDPOINT
 * ============================================================================
 * HOW IT WORKS:
 * 1. Reads the HTTP `Authorization` header (`Bearer <token>`).
 * 2. Cryptographically verifies the JWT signature and expiration.
 * 3. Extracts the `userId` claim and queries Neon PostgreSQL for the active user record.
 * 4. Returns the current user profile (id, email, name, createdAt).
 * 
 * WHERE ITS EFFECTS LEAD:
 * - Invoked on app startup / page refresh by `AuthContext.tsx`.
 * - Confirms that the stored token in localStorage is still valid and not revoked.
 * - Restores the user session seamlessly, allowing persistent authentication.
 */

import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getAuthUserFromRequest } from '@/lib/jwt'

export async function GET(request: Request) {
  try {
    // 1. Verify Bearer token from request headers
    const auth = getAuthUserFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sql = getDb()

    // 2. Query Neon DB for user details corresponding to verified token userId
    const users = await sql`
      SELECT id, email, name, created_at FROM users WHERE id = ${auth.userId} LIMIT 1
    `

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = users[0]

    // 3. Return sanitized profile data
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
      },
    })
  } catch (err: any) {
    console.error('Me endpoint error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

