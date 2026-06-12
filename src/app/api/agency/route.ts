/**
 * Agency Settings API
 *
 * GET  /api/agency?userId=...  — Get agency branding settings
 * POST /api/agency             — Update agency branding settings
 *
 * Only Pro/Managed users can set custom branding.
 * Free/Starter users receive the default seosights branding.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getPlanLimits } from '@/lib/plan-limits'

export const dynamic = 'force-dynamic'

// GET: Retrieve agency settings
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      tier: true,
      agencyName: true,
      agencyLogoUrl: true,
      agencyPrimaryColor: true,
      agencySecondaryColor: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const limits = getPlanLimits(user.tier)
  const canWhiteLabel = limits.allow_white_label

  return NextResponse.json({
    tier: user.tier,
    canWhiteLabel,
    agencyName: user.agencyName || '',
    agencyLogoUrl: user.agencyLogoUrl || '',
    agencyPrimaryColor: user.agencyPrimaryColor || '#10b981',
    agencySecondaryColor: user.agencySecondaryColor || '#6B7280',
  })
}

// POST: Update agency settings
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, agencyName, agencyLogoUrl, agencyPrimaryColor, agencySecondaryColor } = body

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { tier: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const limits = getPlanLimits(user.tier)
  if (!limits.allow_white_label) {
    return NextResponse.json(
      {
        error: 'White-label branding is a Pro feature. Please upgrade to customize your reports.',
        upgradeRequired: true,
      },
      { status: 403 }
    )
  }

  // Validate HEX colors
  const hexRegex = /^#[0-9A-Fa-f]{6}$/
  const primaryColor = agencyPrimaryColor && hexRegex.test(agencyPrimaryColor) ? agencyPrimaryColor : '#10b981'
  const secondaryColor = agencySecondaryColor && hexRegex.test(agencySecondaryColor) ? agencySecondaryColor : '#6B7280'

  await db.user.update({
    where: { id: userId },
    data: {
      agencyName: agencyName || null,
      agencyLogoUrl: agencyLogoUrl || null,
      agencyPrimaryColor: primaryColor,
      agencySecondaryColor: secondaryColor,
    },
  })

  return NextResponse.json({
    success: true,
    agencyName: agencyName || null,
    agencyLogoUrl: agencyLogoUrl || null,
    agencyPrimaryColor: primaryColor,
    agencySecondaryColor: secondaryColor,
  })
}
