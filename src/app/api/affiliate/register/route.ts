/**
 * Affiliate Registration API
 *
 * POST /api/affiliate/register
 *
 * Body: { userId: string, preferredCode?: string }
 *
 * Creates an affiliate record for the user with a unique code.
 */

import { NextRequest, NextResponse } from 'next/server'
import { registerAffiliate } from '@/lib/affiliate'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, preferredCode } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const result = await registerAffiliate(userId, preferredCode)

    return NextResponse.json({
      success: true,
      affiliateId: result.id,
      affiliateCode: result.affiliateCode,
    })
  } catch (error) {
    console.error('[affiliate:register] Error:', error)
    return NextResponse.json(
      { error: 'Failed to register as affiliate' },
      { status: 500 }
    )
  }
}
