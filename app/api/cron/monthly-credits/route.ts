import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// This endpoint is called by Vercel Cron on the 1st of each month
// Or can be manually triggered
export async function GET(req: NextRequest) {
  try {
    // Verify the request is from Vercel Cron or has the correct authorization
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-cron-secret-change-in-production'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find all users who haven't received monthly bonus this month
    const eligibleUsers = await sql`
      SELECT u.id, u.email, u.name
      FROM users u
      WHERE NOT EXISTS (
        SELECT 1 FROM transactions t
        WHERE t.user_id = u.id
        AND t.type = 'monthly_bonus'
        AND t.created_at >= DATE_TRUNC('month', CURRENT_DATE)
      )
    `

    const usersArray = Array.isArray(eligibleUsers) ? eligibleUsers : eligibleUsers.rows
    
    if (!usersArray || usersArray.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No eligible users this month',
        usersProcessed: 0
      })
    }

    let successCount = 0
    let errorCount = 0
    const errors: any[] = []

    // Process each user
    for (const user of usersArray) {
      try {
        const userId = (user as any).id
        // Add 100 credits to the user
        await sql`
          UPDATE credits
          SET total = total + 100,
              remaining = remaining + 100,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${userId}
        `

        // Record the transaction
        await sql`
          INSERT INTO transactions (user_id, type, amount, credits, description)
          VALUES (
            ${userId},
            'monthly_bonus',
            0,
            100,
            'Monthly bonus - 100 free QR credits'
          )
        `

        successCount++
      } catch (error: any) {
        errorCount++
        errors.push({
          userId: (user as any).id,
          email: (user as any).email,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Monthly credits distributed successfully`,
      usersProcessed: successCount,
      errors: errorCount > 0 ? errors : undefined,
      totalEligible: usersArray.length
    })

  } catch (error: any) {
    console.error('Monthly credits cron error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to distribute monthly credits',
        success: false
      },
      { status: 500 }
    )
  }
}
