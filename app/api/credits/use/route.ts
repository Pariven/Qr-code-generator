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

    const { count } = await req.json()

    if (!count || count <= 0) {
      return NextResponse.json(
        { error: 'Invalid credit count' },
        { status: 400 }
      )
    }

    // Get current credits
    const credits = await sql`
      SELECT total, used, remaining
      FROM credits
      WHERE user_id = ${session.userId}
      FOR UPDATE
    `

    if (credits.length === 0) {
      return NextResponse.json(
        { error: 'Credit balance not found' },
        { status: 404 }
      )
    }

    const currentCredits = credits[0]

    if (currentCredits.remaining < count) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          remaining: currentCredits.remaining,
          needed: count
        },
        { status: 400 }
      )
    }

    // Update credits
    const updated = await sql`
      UPDATE credits
      SET used = used + ${count},
          remaining = remaining - ${count},
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${session.userId}
      RETURNING total, used, remaining
    `

    // Record transaction
    await sql`
      INSERT INTO transactions (user_id, type, amount, credits, description)
      VALUES (${session.userId}, 'usage', 0, ${count}, ${`Generated ${count} QR code${count > 1 ? 's' : ''}`})
    `

    return NextResponse.json({
      success: true,
      balance: {
        total: updated[0].total,
        used: updated[0].used,
        remaining: updated[0].remaining,
      },
    })
  } catch (error) {
    console.error('Use credits error:', error)
    return NextResponse.json(
      { error: 'Failed to use credits' },
      { status: 500 }
    )
  }
}
