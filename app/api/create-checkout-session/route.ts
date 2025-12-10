import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-server'

export async function POST(req: NextRequest) {
  try {
    const { tierId, tierName, price, credits } = await req.json()

    if (!price || !credits) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${tierName} Package - Noir Intelligence QR`,
              description: `${credits.toLocaleString()} QR Credits (Never Expire)`,
              images: ['https://your-domain.com/qr-logo.png'], // Add your logo URL
            },
            unit_amount: price * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}&credits=${credits}&price=${price}`,
      cancel_url: `${req.headers.get('origin')}/?canceled=true`,
      metadata: {
        tierId,
        tierName,
        credits: credits.toString(),
        price: price.toString(),
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
