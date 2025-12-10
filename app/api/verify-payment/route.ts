import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-server'
import { sql } from '@/lib/db'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    
    if (!session.isLoggedIn || !session.email || !session.userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { sessionId } = await req.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session ID' },
        { status: 400 }
      )
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Check if credits were already added (prevent duplicate credits)
    const existingTransactions = await sql`
      SELECT id FROM transactions 
      WHERE user_id = ${session.userId} 
      AND stripe_session_id = ${sessionId}
    `
    const transactionsArray = Array.isArray(existingTransactions) ? existingTransactions : existingTransactions.rows

    if (transactionsArray && transactionsArray.length > 0) {
      console.log(`Credits already added for session ${sessionId}`)
      return NextResponse.json({ 
        success: true, 
        message: 'Credits already added',
        alreadyProcessed: true 
      })
    }

    // Extract metadata
    const credits = parseInt(checkoutSession.metadata?.credits || '0')
    const price = parseFloat(checkoutSession.metadata?.price || '0')

    if (!credits || !price) {
      return NextResponse.json(
        { error: 'Invalid session metadata' },
        { status: 400 }
      )
    }

    // Add credits
    await sql`
      UPDATE credits
      SET total = total + ${credits},
          remaining = remaining + ${credits},
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${session.userId}
    `

    // Record transaction
    await sql`
      INSERT INTO transactions (user_id, type, amount, credits, description, stripe_session_id)
      VALUES (
        ${session.userId},
        'purchase',
        ${price},
        ${credits},
        ${`Purchased ${credits.toLocaleString()} QR credits for $${price}`},
        ${sessionId}
      )
    `

    console.log(`✅ Manually verified and added ${credits} credits for ${session.email}`)

    return NextResponse.json({ 
      success: true, 
      credits,
      message: 'Credits added successfully' 
    })

  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
