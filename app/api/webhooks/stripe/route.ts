import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-server'
import { sql } from '@/lib/db'
import { headers } from 'next/headers'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  let event

  try {
    // For local testing without Stripe CLI, skip webhook verification
    if (!signature || !webhookSecret || webhookSecret === 'whsec_test_local_secret') {
      console.log('⚠️ Webhook signature verification skipped for local testing')
      event = JSON.parse(body)
    } else {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    }
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

      console.log('💳 Payment successful:', {
        sessionId: session.id,
        customerEmail: session.customer_email,
        credits: session.metadata?.credits,
        price: session.metadata?.price,
      })

      try {
        const credits = parseInt(session.metadata?.credits || '0')
        const price = parseFloat(session.metadata?.price || '0')
        const customerEmail = session.customer_email

        if (!customerEmail || !credits) {
          console.error('Missing email or credits in session metadata')
          break
        }

        // Find user by email
        const users = await sql`
          SELECT id FROM users WHERE email = ${customerEmail}
        `
        const usersArray = Array.isArray(users) ? users : users.rows
        
        if (!usersArray || usersArray.length === 0) {
          console.error('User not found:', customerEmail)
          break
        }

        const userId = (usersArray[0] as any).id

        // Add credits to user account
        await sql`
          UPDATE credits
          SET total = total + ${credits},
              remaining = remaining + ${credits},
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${userId}
        `

        // Record transaction
        await sql`
          INSERT INTO transactions (user_id, type, amount, credits, description, stripe_session_id)
          VALUES (
            ${userId},
            'purchase',
            ${price},
            ${credits},
            ${`Purchased ${credits.toLocaleString()} QR credits for $${price}`},
            ${session.id}
          )
        `

        console.log(`✅ Added ${credits} credits to user ${customerEmail}`)
      } catch (error) {
        console.error('Error processing payment:', error)
      }
      
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
