/**
 * Affiliate Stats API
 *
 * GET /api/affiliate/stats?userId=...
 *
 * Returns comprehensive affiliate dashboard data:
 * - Referral link, code, active count
 * - Earnings (total + pending)
 * - Current commission tier + next tier info
 * - Recent payouts and referrals
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAffiliateStats } from '@/lib/affiliate'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const stats = await getAffiliateStats(userId)

    if (!stats) {
      return NextResponse.json({
        isAffiliate: false,
        message: 'User is not registered as an affiliate',
      })
    }

    return NextResponse.json({
      isAffiliate: true,
      ...stats,
    })
  } catch (error) {
    console.error('[affiliate:stats] Error:', error)
    return NextResponse.json(
      { error: 'Failed to load affiliate stats' },
      { status: 500 }
    )
  }
}
