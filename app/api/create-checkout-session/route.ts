import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-server'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  try {
    // Get user session to retrieve email
    const authSession = await auth()
    
    if (!authSession?.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to purchase credits' },
        { status: 401 }
      )
    }

    const session = { email: authSession.user.email, userId: parseInt(authSession.user.id!) }

    const { tierId, tierName, price, credits, currency = 'USD', actualPrice } = await req.json()

    if (!price || !credits) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use actualPrice (converted) if provided, otherwise use base price
    const finalPrice = actualPrice || price
    const stripeCurrency = currency === 'MYR' ? 'myr' : 'usd'

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: session.email, // Add customer email from session
      line_items: [
        {
          price_data: {
            currency: stripeCurrency,
            product_data: {
              name: `${tierName} Package - Noir Intelligence QR`,
              description: `${credits.toLocaleString()} QR Credits (Never Expire)`,
              images: ['https://your-domain.com/qr-logo.png'], // Add your logo URL
            },
            unit_amount: Math.round(finalPrice * 100), // Stripe uses cents/sen
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}&credits=${credits}&price=${price}&currency=${currency}`,
      cancel_url: `${req.headers.get('origin')}/?canceled=true`,
      metadata: {
        tierId,
        tierName,
        credits: credits.toString(),
        price: price.toString(),
        currency: currency,
        actualPrice: finalPrice.toString(),
        userEmail: session.email, // Add email to metadata as backup
      },
    })

    return NextResponse.json({ sessionId: checkoutSession.id })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
