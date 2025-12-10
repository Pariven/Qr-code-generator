import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-server'
import { headers } from 'next/headers'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object

      // Payment successful, credits should be added
      console.log('Payment successful:', {
        sessionId: session.id,
        credits: session.metadata?.credits,
        price: session.metadata?.price,
      })

      // In production, you would:
      // 1. Store transaction in database
      // 2. Add credits to user account
      // 3. Send confirmation email
      
      break

    case 'payment_intent.succeeded':
      console.log('PaymentIntent succeeded')
      break

    case 'payment_intent.payment_failed':
      console.log('PaymentIntent failed')
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
