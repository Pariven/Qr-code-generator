import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const users = await sql`
      SELECT id, email, name FROM users WHERE email = ${email}
    `

    const usersArray = Array.isArray(users) ? users : users.rows
    if (!usersArray || usersArray.length === 0) {
      // For security, don't reveal if user exists or not
      return NextResponse.json({
        message: 'If an account exists with this email, you will receive a password reset link.'
      })
    }

    const user = usersArray[0] as any

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Store reset token in database
    await sql`
      UPDATE users 
      SET reset_token = ${resetToken}, 
          reset_token_expiry = ${resetTokenExpiry.toISOString()}
      WHERE id = ${user.id}
    `

    // In production, send email here using a service like SendGrid, Resend, or Nodemailer
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`
    
    // Send password reset email
    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl: resetUrl,
      })
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      // Continue anyway - the reset token is stored in database
    }

    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a password reset link.',
      // In development, include the reset URL in the response
      ...(process.env.NODE_ENV === 'development' && { 
        resetUrl,
        debug: 'Check your email or the server console for the reset link'
      })
    })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
