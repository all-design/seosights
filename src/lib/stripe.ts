import Stripe from 'stripe'
import { getSetting } from '@/lib/settings'

// ── Lazy Stripe client (reads from DB first, then env var) ────────────────

let _stripe: Stripe | null = null

/**
 * Get the Stripe client instance.
 * Uses the secret key from DB settings if available, otherwise falls back to env var.
 */
export async function getStripe(): Promise<Stripe> {
  if (_stripe) return _stripe

  const secretKey = await getSetting('stripe_secret_key', process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder')
  _stripe = new Stripe(secretKey!, {
    apiVersion: '2024-12-18.acacia',
  })
  return _stripe
}

/**
 * Synchronous Stripe instance (uses env var only).
 * Use this for top-level module code. For runtime, prefer getStripe().
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-12-18.acacia',
})

// ── Price IDs (lazy — reads from DB at runtime) ──────────────────────────

/**
 * Get plan price IDs, checking DB settings first, then env vars.
 */
export async function getPlanPrices() {
  const [starter, pro, managed] = await Promise.all([
    getSetting('stripe_starter_price_id', process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_placeholder'),
    getSetting('stripe_pro_price_id', process.env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder'),
    getSetting('stripe_managed_price_id', process.env.STRIPE_MANAGED_PRICE_ID || 'price_managed_placeholder'),
  ])

  return { starter: starter!, pro: pro!, managed: managed! }
}

// Price IDs for each plan (env var defaults — use getPlanPrices() for DB overrides)
export const PLAN_PRICES = {
  starter: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_placeholder',
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder',
  managed: process.env.STRIPE_MANAGED_PRICE_ID || 'price_managed_placeholder',
}

// Monthly amounts for each plan (in cents, for fallback tier detection)
export const PLAN_AMOUNTS = {
  starter: 990,     // $9.90 (launch promo)
  pro: 7900,        // $79.00
  managed: 19900,   // $199.00
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
