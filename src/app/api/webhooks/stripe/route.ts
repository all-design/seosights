import { headers } from 'next/headers'
import { stripe, getTierFromAmount, mapSubscriptionStatus } from '@/lib/stripe'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  let event

  // In development, skip signature verification if no webhook secret
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    try {
      event = JSON.parse(body)
    } catch {
      return Response.json({ error: 'Invalid payload' }, { status: 400 })
    }
  } else {
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig!,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('Webhook signature verification failed:', message)
      return Response.json({ error: `Webhook Error: ${message}` }, { status: 400 })
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.userId

        if (userId) {
          const tier = getTierFromAmount(session.amount_total || 0)
          await db.user.update({
            where: { id: userId },
            data: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              subscriptionStatus: 'active',
              tier: tier,
            },
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        // Find user by stripeCustomerId
        const user = await db.user.findFirst({
          where: { stripeCustomerId: subscription.customer as string },
        })
        if (user) {
          const updatedData: {
            subscriptionStatus: string
            tier?: string
          } = {
            subscriptionStatus: mapSubscriptionStatus(subscription.status),
          }

          // Update tier based on plan metadata if available
          if (subscription.metadata?.plan) {
            updatedData.tier = subscription.metadata.plan
          }

          await db.user.update({
            where: { id: user.id },
            data: updatedData,
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const deletedSub = event.data.object
        const user = await db.user.findFirst({
          where: { stripeCustomerId: deletedSub.customer as string },
        })
        if (user) {
          await db.user.update({
            where: { id: user.id },
            data: {
              subscriptionStatus: 'canceled',
              tier: 'trial',
            },
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const user = await db.user.findFirst({
          where: { stripeCustomerId: invoice.customer as string },
        })
        if (user) {
          await db.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: 'past_due' },
          })
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error(`Error handling event ${event.type}:`, error)
    return Response.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return Response.json({ received: true })
}
