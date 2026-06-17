import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Verify token and check expiry
    const users = await sql`
      SELECT id, email, reset_token_expiry 
      FROM users 
      WHERE reset_token = ${token}
    `

    const usersArray = Array.isArray(users) ? users : users.rows
    if (!usersArray || usersArray.length === 0) {
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      )
    }

    const user = usersArray[0] as any
    const expiryDate = new Date(user.reset_token_expiry)
    const now = new Date()

    if (expiryDate < now) {
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update password and clear reset token
    await sql`
      UPDATE users 
      SET password_hash = ${hashedPassword},
          reset_token = NULL,
          reset_token_expiry = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${user.id}
    `

    console.log(`Password successfully reset for user: ${user.email}`)

    return NextResponse.json({
      message: 'Password has been reset successfully'
    })
  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
