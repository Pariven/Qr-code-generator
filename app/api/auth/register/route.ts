import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const newUser = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${passwordHash})
      RETURNING id, email, name
    `

    const userId = newUser[0].id

    // Create initial credit balance (100 free credits)
    await sql`
      INSERT INTO credits (user_id, total, used, remaining)
      VALUES (${userId}, 100, 0, 100)
    `

    // Record free credits transaction
    await sql`
      INSERT INTO transactions (user_id, type, amount, credits, description)
      VALUES (${userId}, 'signup_bonus', 0, 100, 'Free signup bonus - 100 QR credits')
    `

    // Create session
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    session.userId = userId
    session.email = newUser[0].email
    session.name = newUser[0].name
    session.isLoggedIn = true
    await session.save()

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: newUser[0].email,
        name: newUser[0].name,
      },
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
