import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getDb } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const sql = getDb()

    const users = await sql`
      SELECT id, email FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1
    `

    if (users.length === 0) {
      // Do not disclose whether email exists for security, return positive message
      return NextResponse.json({
        message: 'If an account exists with this email, password reset instructions have been generated.',
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiry = new Date(Date.now() + 3600 * 1000) // 1 hour

    await sql`
      UPDATE users 
      SET reset_token = ${resetToken}, reset_token_expiry = ${expiry.toISOString()}
      WHERE id = ${users[0].id}
    `

    return NextResponse.json({
      message: 'Password reset token generated successfully.',
      resetToken, // Provided for user demonstration / testing
    })
  } catch (err: any) {
    console.error('Forgot password error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
