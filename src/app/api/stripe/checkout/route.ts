/**
 * Stripe Checkout API
 *
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout session for the given user and tier.
 * For "managed" tier, returns a redirect instruction to the contact form.
 */

import { stripe, PLAN_PRICES } from '@/lib/stripe'
import { db } from '@/lib/db'

interface CheckoutBody {
  userId: string
  tier: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutBody
    const { userId, tier } = body

    if (!userId || !tier) {
      return Response.json(
        { error: 'Missing required fields: userId, tier' },
        { status: 400 }
      )
    }

    // For "managed" tier, redirect to contact form instead of Stripe
    if (tier === 'managed') {
      return Response.json({
        redirect: 'contact',
        message: 'Managed tier requires custom setup. Please contact us.',
        url: '/#cta',
      })
    }

    // Validate tier
    const validTiers = ['starter', 'pro']
    if (!validTiers.includes(tier)) {
      return Response.json(
        { error: 'Invalid tier. Must be starter or pro' },
        { status: 400 }
      )
    }

    // Look up user in database
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Map tier to Stripe price ID
    const priceId = PLAN_PRICES[tier as keyof typeof PLAN_PRICES]
    if (!priceId || priceId.includes('placeholder')) {
      return Response.json(
        { error: `Stripe pricing not configured for ${tier} tier. Please set STRIPE_${tier.toUpperCase()}_PRICE_ID environment variable.` },
        { status: 500 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId || undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/#pricing`,
      metadata: {
        userId: user.id,
        plan: tier,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan: tier,
        },
      },
    })

    return Response.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error: unknown) {
    console.error('[Stripe Checkout] Error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
