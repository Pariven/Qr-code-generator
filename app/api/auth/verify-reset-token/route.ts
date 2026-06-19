import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    // Check if token exists and is not expired
    const users = await sql`
      SELECT id, email, reset_token_expiry 
      FROM users 
      WHERE reset_token = ${token}
    `

    const usersArray = Array.isArray(users) ? users : users.rows
    if (!usersArray || usersArray.length === 0) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid reset token'
      })
    }

    const user = usersArray[0] as any
    const expiryDate = new Date(user.reset_token_expiry)
    const now = new Date()

    if (expiryDate < now) {
      return NextResponse.json({
        valid: false,
        error: 'Reset token has expired'
      })
    }

    return NextResponse.json({
      valid: true,
      email: user.email
    })
  } catch (error: any) {
    console.error('Verify reset token error:', error)
    return NextResponse.json(
      { valid: false, error: 'An error occurred' },
      { status: 500 }
    )
  }
}
