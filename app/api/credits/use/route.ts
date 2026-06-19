import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  try {
    const authSession = await auth()

    if (!authSession?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const session = { userId: parseInt(authSession.user.id) }

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

    const creditsArray = Array.isArray(credits) ? credits : credits.rows
    if (!creditsArray || creditsArray.length === 0) {
      return NextResponse.json(
        { error: 'Credit balance not found' },
        { status: 404 }
      )
    }

    const currentCredits = creditsArray[0] as any

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

    const updatedArray = Array.isArray(updated) ? updated : updated.rows
    const updatedData = updatedArray[0] as any

    // Record transaction
    await sql`
      INSERT INTO transactions (user_id, type, amount, credits, description)
      VALUES (${session.userId}, 'usage', 0, ${count}, ${`Generated ${count} QR code${count > 1 ? 's' : ''}`})
    `

    return NextResponse.json({
      success: true,
      balance: {
        total: updatedData.total,
        used: updatedData.used,
        remaining: updatedData.remaining,
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
