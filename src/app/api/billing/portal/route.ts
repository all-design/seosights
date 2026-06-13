import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId } = body as { userId: string }

    if (!userId) {
      return Response.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    // Look up user's stripeCustomerId
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.stripeCustomerId) {
      return Response.json(
        { error: 'No Stripe customer ID found for this user' },
        { status: 400 }
      )
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/`,
    })

    return Response.json({ url: session.url })
  } catch (error: unknown) {
    console.error('Error creating portal session:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
