import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-12-18.acacia',
})

// Price IDs for each plan (configure in Stripe Dashboard)
export const PLAN_PRICES = {
  starter: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_placeholder',
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder',
  managed: process.env.STRIPE_MANAGED_PRICE_ID || 'price_managed_placeholder',
}

// Monthly amounts for each plan (in cents, for fallback tier detection)
export const PLAN_AMOUNTS = {
  starter: 500,     // $5.00
  pro: 7900,        // $79.00
  managed: 29900,   // $299.00
} as const

// Map Stripe amount to tier
export function getTierFromAmount(amount: number): string {
  if (amount >= PLAN_AMOUNTS.managed) return 'managed'
  if (amount >= PLAN_AMOUNTS.pro) return 'pro'
  if (amount >= PLAN_AMOUNTS.starter) return 'starter'
  return 'trial'
}

/**
 * Detect tier from Stripe Price ID.
 * Compares against configured price IDs from environment variables.
 */
export function getTierFromPriceId(priceId: string): string | null {
  if (priceId === PLAN_PRICES.starter) return 'starter'
  if (priceId === PLAN_PRICES.pro) return 'pro'
  if (priceId === PLAN_PRICES.managed) return 'managed'

  // Fallback: pattern matching for common Stripe price ID formats
  const lower = priceId.toLowerCase()
  if (lower.includes('starter') || lower.includes('basic')) return 'starter'
  if (lower.includes('pro') || lower.includes('professional')) return 'pro'
  if (lower.includes('managed') || lower.includes('enterprise') || lower.includes('agency')) return 'managed'

  return null
}

// Map Stripe subscription status to our internal status
export function mapSubscriptionStatus(status: string): string {
  switch (status) {
    case 'active': return 'active'
    case 'past_due': return 'past_due'
    case 'canceled': return 'canceled'
    case 'trialing': return 'trial'
    default: return 'trial'
  }
}
