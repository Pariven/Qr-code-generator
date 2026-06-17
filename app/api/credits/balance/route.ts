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

    const credits = await sql`
      SELECT total, used, remaining, updated_at
      FROM credits
      WHERE user_id = ${session.userId}
    `

    const creditsArray = Array.isArray(credits) ? credits : credits.rows
    if (!creditsArray || creditsArray.length === 0) {
      // Create initial credits if not exist
      await sql`
        INSERT INTO credits (user_id, total, used, remaining)
        VALUES (${session.userId}, 100, 0, 100)
      `
      return NextResponse.json({
        total: 100,
        used: 0,
        remaining: 100,
        lastUpdated: new Date().toISOString(),
      })
    }

    const creditData = creditsArray[0] as any
    return NextResponse.json({
      total: creditData.total,
      used: creditData.used,
      remaining: creditData.remaining,
      lastUpdated: creditData.updated_at,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('Get credits error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    )
  }
}
