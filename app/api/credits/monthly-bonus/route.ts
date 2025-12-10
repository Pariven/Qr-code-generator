import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user already received monthly credits this month
    const existingBonus = await sql`
      SELECT id FROM transactions
      WHERE user_id = ${session.userId}
      AND type = 'monthly_bonus'
      AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `

    const existingArray = Array.isArray(existingBonus) ? existingBonus : existingBonus.rows
    
    if (existingArray && existingArray.length > 0) {
      return NextResponse.json({
        alreadyReceived: true,
        message: 'Monthly credits already received this month'
      })
    }

    // Add 100 monthly credits
    await sql`
      UPDATE credits
      SET total = total + 100,
          remaining = remaining + 100,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${session.userId}
    `

    // Record transaction
    await sql`
      INSERT INTO transactions (user_id, type, amount, credits, description)
      VALUES (
        ${session.userId},
        'monthly_bonus',
        0,
        100,
        'Monthly bonus - 100 free QR credits'
      )
    `

    // Get updated balance
    const updatedCredits = await sql`
      SELECT total, used, remaining FROM credits
      WHERE user_id = ${session.userId}
    `

    const creditsArray = Array.isArray(updatedCredits) ? updatedCredits : updatedCredits.rows
    const balance = creditsArray[0] as any

    return NextResponse.json({
      success: true,
      creditsAdded: 100,
      newBalance: {
        total: balance.total,
        used: balance.used,
        remaining: balance.remaining
      }
    })

  } catch (error: any) {
    console.error('Monthly credits error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add monthly credits' },
      { status: 500 }
    )
  }
}
