import { stripe, PLAN_PRICES } from '@/lib/stripe'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, priceId, plan } = body as {
      userId: string
      priceId: string
      plan: string
    }

    if (!userId || !priceId || !plan) {
      return Response.json(
        { error: 'Missing required fields: userId, priceId, plan' },
        { status: 400 }
      )
    }

    // Validate plan
    const validPlans = ['starter', 'pro', 'managed']
    if (!validPlans.includes(plan)) {
      return Response.json(
        { error: 'Invalid plan. Must be starter, pro, or managed' },
        { status: 400 }
      )
    }

    // Look up user in database
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Create checkout session
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
        plan: plan,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan: plan,
        },
      },
    })

    return Response.json({ url: session.url })
  } catch (error: unknown) {
    console.error('Error creating checkout session:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
