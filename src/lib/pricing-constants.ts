/**
 * Shared pricing constants — safe for both server and client bundles.
 *
 * IMPORTANT: This file must NOT import any Node.js-only modules (stripe, etc.)
 * because it is imported by client-side components (PricingCard).
 */

// Price IDs for each plan (env var defaults — use getPlanPrices() for DB overrides)
export const PLAN_PRICES = {
  starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_starter_placeholder',
  pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_pro_placeholder',
  managed: process.env.NEXT_PUBLIC_STRIPE_MANAGED_PRICE_ID || 'price_managed_placeholder',
} as const

// Monthly amounts for each plan (in cents, for fallback tier detection)
export const PLAN_AMOUNTS = {
  starter: 990,     // $9.90 (launch promo)
  pro: 7900,        // $79.00
  managed: 19900,   // $199.00
} as const
