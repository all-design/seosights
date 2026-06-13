/**
 * Affiliate System — Commission Engine & Utility Functions
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * GRADUATED COMMISSION SCALE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The more active referrals an affiliate has, the higher their commission %.
 * This creates a powerful incentive for influencers to promote seosights:
 *
 *   1-9 active referrals    → 10% commission
 *   10-49 active referrals  → 20% commission
 *   50-99 active referrals  → 30% commission
 *   100-249 active referrals→ 40% commission
 *   250+ active referrals   → 50% commission
 *
 * Example: An influencer with 250 Pro users ($79/mo) earns:
 *   $79 × 250 × 0.50 = $9,875/month passive income
 *   → They'll make YouTube tutorials about seosights FOR FREE.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * REFERRAL FLOW
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1. Affiliate shares link: https://seosights.com/?ref=marko10
 * 2. Visitor lands → frontend reads ?ref= param → stores in cookie (60 days)
 * 3. Visitor registers → cookie value sent to backend → stored in referredByAffiliateId
 * 4. User pays → Stripe webhook triggers processAffiliateCommission()
 * 5. Commission calculated at current tier %, recorded in AffiliatePayout
 */

import { db } from '@/lib/db'

// ─────────────────────────────────────────────────────────────────────────────
// Commission Tier Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const COMMISSION_TIERS = [
  { minReferrals: 250, percentage: 0.50, label: '50%' },
  { minReferrals: 100, percentage: 0.40, label: '40%' },
  { minReferrals: 50,  percentage: 0.30, label: '30%' },
  { minReferrals: 10,  percentage: 0.20, label: '20%' },
  { minReferrals: 0,   percentage: 0.10, label: '10%' },
] as const

/**
 * Get the commission percentage for a given number of active referrals.
 * Uses the graduated scale: more referrals → higher %.
 */
export function getAffiliateCommissionPercentage(activeReferrals: number): number {
  for (const tier of COMMISSION_TIERS) {
    if (activeReferrals >= tier.minReferrals) {
      return tier.percentage
    }
  }
  return 0.10 // Default: 10%
}

/**
 * Get the current tier info for display purposes.
 */
export function getAffiliateTierInfo(activeReferrals: number): {
  percentage: number
  label: string
  nextTier: { minReferrals: number; percentage: number; label: string } | null
  referralsToNextTier: number
} {
  const currentPercentage = getAffiliateCommissionPercentage(activeReferrals)
  const currentLabel = COMMISSION_TIERS.find(t => t.percentage === currentPercentage)?.label || '10%'

  // Find the next tier up
  let nextTier: { minReferrals: number; percentage: number; label: string } | null = null
  for (const tier of COMMISSION_TIERS) {
    if (tier.percentage > currentPercentage) {
      nextTier = { minReferrals: tier.minReferrals, percentage: tier.percentage, label: tier.label }
      break
    }
  }

  return {
    percentage: currentPercentage,
    label: currentLabel,
    nextTier,
    referralsToNextTier: nextTier ? nextTier.minReferrals - activeReferrals : 0,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Affiliate Code Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a unique affiliate code from a user's name or email.
 * Format: lowercase alphanumeric, 4-20 chars, no spaces.
 *
 * Examples:
 *   "Marko Petrović" → "marko10" (or "marko42" if taken)
 *   "seo@agency.com" → "seoagency"
 */
export async function generateAffiliateCode(userInput: string): Promise<string> {
  // Clean the input: remove special chars, keep alphanumeric
  let base = userInput
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15)

  if (base.length < 3) {
    base = 'aff' + Math.random().toString(36).slice(2, 6)
  }

  // Check if the base code is available
  const existing = await db.affiliate.findUnique({ where: { affiliateCode: base } })

  if (!existing) return base

  // Try with numeric suffix
  for (let i = 10; i < 100; i++) {
    const candidate = base.slice(0, 13) + String(i)
    const taken = await db.affiliate.findUnique({ where: { affiliateCode: candidate } })
    if (!taken) return candidate
  }

  // Fallback: random suffix
  return base.slice(0, 8) + Math.random().toString(36).slice(2, 7)
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Commission Processing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Process an affiliate commission when a user makes a payment.
 *
 * Called from the Stripe webhook handler on:
 *   - checkout.session.completed
 *   - invoice.payment_succeeded
 *
 * Flow:
 * 1. Check if the paying user was referred by an affiliate
 * 2. Count how many active referrals that affiliate currently has
 * 3. Calculate commission at the current tier %
 * 4. Record the payout in AffiliatePayout
 * 5. Update affiliate's earnings counters
 */
export async function processAffiliateCommission(
  paidUserId: string,
  amountPaidUsd: number
): Promise<void> {
  // 1. Check if this user was referred by an affiliate
  const user = await db.user.findUnique({
    where: { id: paidUserId },
    select: { referredByAffiliateId: true, subscriptionStatus: true },
  })

  if (!user?.referredByAffiliateId) return // Direct user, no affiliate payout

  const affiliateId = user.referredByAffiliateId

  // 2. Count active referrals for this affiliate
  const activeReferralsCount = await db.user.count({
    where: {
      referredByAffiliateId: affiliateId,
      subscriptionStatus: 'active',
    },
  })

  // Also count from AffiliateReferral for more accuracy
  const activeReferralsFromTable = await db.affiliateReferral.count({
    where: {
      affiliateId,
      status: 'active',
    },
  })

  // Use the higher of the two counts for the affiliate's benefit
  const activeReferrals = Math.max(activeReferralsCount, activeReferralsFromTable)

  // 3. Calculate commission
  const commissionPercentage = getAffiliateCommissionPercentage(activeReferrals)
  const commissionAmount = amountPaidUsd * commissionPercentage

  if (commissionAmount <= 0) return

  // 4. Record the payout
  await db.affiliatePayout.create({
    data: {
      affiliateId,
      referredUserId: paidUserId,
      amountUsd: commissionAmount,
      percentageApplied: commissionPercentage * 100,
      sourceAmountUsd: amountPaidUsd,
      status: 'pending',
    },
  })

  // 5. Update affiliate counters
  await db.affiliate.update({
    where: { id: affiliateId },
    data: {
      totalEarningsUsd: { increment: commissionAmount },
      pendingPayoutUsd: { increment: commissionAmount },
      totalReferredActive: activeReferrals,
    },
  })

  // 6. Update referral status to 'active' if this is their first payment
  const existingReferral = await db.affiliateReferral.findUnique({
    where: { referredUserId: paidUserId },
  })

  if (existingReferral && existingReferral.status !== 'active') {
    await db.affiliateReferral.update({
      where: { id: existingReferral.id },
      data: {
        status: 'active',
        firstPaymentAt: new Date(),
      },
    })
  }

  console.log(
    `[affiliate] Commission: $${commissionAmount.toFixed(2)} (${(commissionPercentage * 100).toFixed(0)}%) ` +
    `for affiliate ${affiliateId} from user ${paidUserId} ` +
    `(payment: $${amountPaidUsd}, active referrals: ${activeReferrals})`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Affiliate Registration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register a user as an affiliate.
 * Generates a unique affiliate code and creates the affiliate record.
 */
export async function registerAffiliate(userId: string, preferredCode?: string): Promise<{
  id: string
  affiliateCode: string
}> {
  // Check if user is already an affiliate
  const existing = await db.affiliate.findUnique({ where: { userId } })
  if (existing) {
    return { id: existing.id, affiliateCode: existing.affiliateCode }
  }

  // Get user info for code generation
  const user = await db.user.findUnique({ where: { id: userId } })
  const codeInput = preferredCode || user?.name || user?.email || 'affiliate'

  const affiliateCode = await generateAffiliateCode(codeInput)

  const affiliate = await db.affiliate.create({
    data: {
      userId,
      affiliateCode,
    },
  })

  console.log(`[affiliate] New affiliate registered: ${affiliateCode} (user: ${userId})`)

  return { id: affiliate.id, affiliateCode: affiliate.affiliateCode }
}

// ─────────────────────────────────────────────────────────────────────────────
// Referral Tracking
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Link a newly registered user to their referring affiliate.
 * Called during user registration when a referral cookie is present.
 */
export async function linkReferralToAffiliate(
  newUserId: string,
  affiliateCode: string
): Promise<boolean> {
  const affiliate = await db.affiliate.findUnique({
    where: { affiliateCode },
  })

  if (!affiliate) {
    console.log(`[affiliate] Code not found: ${affiliateCode}`)
    return false
  }

  // Update user with affiliate reference
  await db.user.update({
    where: { id: newUserId },
    data: { referredByAffiliateId: affiliate.id },
  })

  // Create referral record
  await db.affiliateReferral.create({
    data: {
      affiliateId: affiliate.id,
      referredUserId: newUserId,
      status: 'registered',
    },
  })

  console.log(`[affiliate] User ${newUserId} referred by affiliate ${affiliateCode}`)

  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// Affiliate Stats
// ─────────────────────────────────────────────────────────────────────────────

export interface AffiliateStats {
  affiliateCode: string
  referralLink: string
  totalReferredActive: number
  totalRegistered: number
  totalEarningsUsd: number
  pendingPayoutUsd: number
  currentCommissionPercentage: number
  currentTierLabel: string
  nextTier: {
    minReferrals: number
    percentage: number
    label: string
  } | null
  referralsToNextTier: number
  recentPayouts: {
    id: string
    amountUsd: number
    percentageApplied: number
    sourceAmountUsd: number
    status: string
    createdAt: string
  }[]
  recentReferrals: {
    id: string
    status: string
    createdAt: string
    firstPaymentAt: string | null
  }[]
}

/**
 * Get comprehensive affiliate stats for a user.
 */
export async function getAffiliateStats(userId: string): Promise<AffiliateStats | null> {
  const affiliate = await db.affiliate.findUnique({
    where: { userId },
    include: {
      payouts: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      referrals: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!affiliate) return null

  const totalRegistered = affiliate.referrals.length
  const tierInfo = getAffiliateTierInfo(affiliate.totalReferredActive)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://seosights.com'

  return {
    affiliateCode: affiliate.affiliateCode,
    referralLink: `${baseUrl}/?ref=${affiliate.affiliateCode}`,
    totalReferredActive: affiliate.totalReferredActive,
    totalRegistered,
    totalEarningsUsd: affiliate.totalEarningsUsd,
    pendingPayoutUsd: affiliate.pendingPayoutUsd,
    currentCommissionPercentage: tierInfo.percentage,
    currentTierLabel: tierInfo.label,
    nextTier: tierInfo.nextTier,
    referralsToNextTier: tierInfo.referralsToNextTier,
    recentPayouts: affiliate.payouts.map(p => ({
      id: p.id,
      amountUsd: p.amountUsd,
      percentageApplied: p.percentageApplied,
      sourceAmountUsd: p.sourceAmountUsd,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    })),
    recentReferrals: affiliate.referrals.map(r => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      firstPaymentAt: r.firstPaymentAt?.toISOString() || null,
    })),
  }
}
