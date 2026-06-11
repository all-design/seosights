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

// Map Stripe amount to tier
export function getTierFromAmount(amount: number): string {
  if (amount >= 29900) return 'managed'   // $299.00
  if (amount >= 7900) return 'pro'        // $79.00
  if (amount >= 500) return 'starter'     // $5.00
  return 'trial'
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
