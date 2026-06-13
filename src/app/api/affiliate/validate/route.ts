/**
 * Affiliate Code Validation API
 *
 * GET /api/affiliate/validate?code=marko10
 *
 * Checks if an affiliate code is valid (exists and is active).
 * Used by the frontend when reading the ?ref= cookie to verify the code.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.json({ valid: false, error: 'Code is required' }, { status: 400 })
  }

  try {
    const affiliate = await db.affiliate.findUnique({
      where: { affiliateCode: code },
      select: {
        id: true,
        affiliateCode: true,
        status: true,
      },
    })

    if (!affiliate) {
      return NextResponse.json({ valid: false, error: 'Code not found' })
    }

    if (affiliate.status === 'suspended') {
      return NextResponse.json({ valid: false, error: 'This affiliate account is suspended' })
    }

    return NextResponse.json({
      valid: true,
      code: affiliate.affiliateCode,
    })
  } catch (error) {
    console.error('[affiliate:validate] Error:', error)
    return NextResponse.json(
      { valid: false, error: 'Validation failed' },
      { status: 500 }
    )
  }
}
