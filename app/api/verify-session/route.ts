import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-server'

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    return NextResponse.json({
      status: session.payment_status,
      customerEmail: session.customer_email,
      metadata: session.metadata,
    })
  } catch (error: any) {
    console.error('Session verification error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
