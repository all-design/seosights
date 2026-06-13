import { headers } from 'next/headers'
import { stripe, PLAN_PRICES, mapSubscriptionStatus } from '@/lib/stripe'
import { db } from '@/lib/db'
import { processAffiliateCommission } from '@/lib/affiliate'

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
          const tier = getTierFromPriceId(session.amount_total || 0)
          await db.user.update({
            where: { id: userId },
            data: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              subscriptionStatus: 'active',
              tier: tier,
            },
          })
          console.log(`[stripe:checkout] User ${userId} → tier: ${tier}`)

          // ── Process affiliate commission ──────────────────────────────
          // Calculate the actual payment amount in USD and pay the referrer
          const amountUsd = (session.amount_total || 0) / 100
          if (amountUsd > 0) {
            try {
              await processAffiliateCommission(userId, amountUsd)
            } catch (affError) {
              // Don't fail the checkout if affiliate processing fails
              console.error('[stripe:checkout] Affiliate commission error:', affError)
            }
          }
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

          // ── Enhanced tier detection ──────────────────────────────────────
          // Priority 1: Check price ID from subscription items (most reliable)
          if (subscription.items?.data && subscription.items.data.length > 0) {
            const priceId = subscription.items.data[0].price?.id

            if (priceId) {
              const detectedTier = detectTierFromPriceId(priceId)
              if (detectedTier) {
                updatedData.tier = detectedTier
                console.log(`[stripe:sub.updated] User ${user.id} → tier: ${detectedTier} (from priceId: ${priceId})`)
              }
            }
          }

          // Priority 2: Check plan metadata from Stripe
          if (!updatedData.tier && subscription.metadata?.plan) {
            const planFromMeta = subscription.metadata.plan.toLowerCase()
            if (['starter', 'pro', 'managed'].includes(planFromMeta)) {
              updatedData.tier = planFromMeta
              console.log(`[stripe:sub.updated] User ${user.id} → tier: ${planFromMeta} (from metadata)`)
            }
          }

          // Priority 3: Fallback to amount-based detection
          if (!updatedData.tier && subscription.items?.data?.[0]?.price?.unit_amount) {
            const amount = subscription.items.data[0].price.unit_amount
            updatedData.tier = getTierFromPriceId(amount)
            console.log(`[stripe:sub.updated] User ${user.id} → tier: ${updatedData.tier} (from amount: ${amount})`)
          }

          await db.user.update({
            where: { id: user.id },
            data: updatedData,
          })

          // Log the tier change for audit trail
          console.log(`[stripe:sub.updated] User ${user.id} updated: status=${updatedData.subscriptionStatus}, tier=${updatedData.tier || user.tier}`)
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
              tier: 'free_trial',
            },
          })
          console.log(`[stripe:sub.deleted] User ${user.id} → tier: free_trial, status: canceled`)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoiceSucceeded = event.data.object
        const payingUser = await db.user.findFirst({
          where: { stripeCustomerId: invoiceSucceeded.customer as string },
        })
        if (payingUser && invoiceSucceeded.amount_paid) {
          const renewalAmountUsd = invoiceSucceeded.amount_paid / 100
          if (renewalAmountUsd > 0) {
            try {
              await processAffiliateCommission(payingUser.id, renewalAmountUsd)
            } catch (affError) {
              console.error('[stripe:invoice.paid] Affiliate commission error:', affError)
            }
          }
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
          console.log(`[stripe:payment_failed] User ${user.id} → status: past_due`)
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

// ─────────────────────────────────────────────────────────────────────────────
// Tier Detection Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect tier from Stripe Price ID.
 * Compares against configured price IDs in PLAN_PRICES.
 */
function detectTierFromPriceId(priceId: string): string | null {
  // Check against configured price IDs (from environment variables)
  if (priceId === PLAN_PRICES.starter) return 'starter'
  if (priceId === PLAN_PRICES.pro) return 'pro'
  if (priceId === PLAN_PRICES.managed) return 'managed'

  // Fallback: pattern matching for common Stripe price ID formats
  // This handles cases where env vars aren't set but price IDs follow conventions
  const priceIdLower = priceId.toLowerCase()
  if (priceIdLower.includes('starter') || priceIdLower.includes('basic')) return 'starter'
  if (priceIdLower.includes('pro') || priceIdLower.includes('professional')) return 'pro'
  if (priceIdLower.includes('managed') || priceIdLower.includes('enterprise') || priceIdLower.includes('agency')) return 'managed'

  return null
}

/**
 * Fallback: detect tier from payment amount (in cents).
 * Used when price ID detection fails.
 */
function getTierFromPriceId(amount: number): string {
  if (amount >= 29900) return 'managed'   // $299.00+
  if (amount >= 7900) return 'pro'        // $79.00+
  if (amount >= 500) return 'starter'     // $5.00+
  return 'free_trial'
}
