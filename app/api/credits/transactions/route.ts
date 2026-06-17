import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { auth } from '@/auth'

export async function GET(req: NextRequest) {
  try {
    const authSession = await auth()

    if (!authSession?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const session = { userId: parseInt(authSession.user.id) }

    const transactions = await sql`
      SELECT id, type, amount, credits, description, created_at
      FROM transactions
      WHERE user_id = ${session.userId}
      ORDER BY created_at DESC
      LIMIT 100
    `

    return NextResponse.json(transactions, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
