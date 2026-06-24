/**
 * Agency Registration API
 *
 * POST /api/auth/register/agency
 *
 * Creates a new user account with tier="managed" and role="agency",
 * including agency branding fields (name, logo, colors).
 * After creation, returns a success message indicating manual setup
 * is required (managed tier = done-for-you service).
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createToken } from '@/lib/auth'
import type { UserRole } from '@/lib/auth'

interface AgencyRegisterBody {
  name: string
  email: string
  password: string
  agencyName: string
  logo?: string | null // base64 data URL
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex)
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AgencyRegisterBody

    // ── Validate required fields ──────────────────────────────────────
    if (!body.name || !body.email || !body.password || !body.agencyName) {
      return NextResponse.json(
        { error: 'Name, email, password, and agency name are required' },
        { status: 400 }
      )
    }

    if (body.password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Validate HEX colors
    const primaryColor = body.primaryColor && isValidHex(body.primaryColor) ? body.primaryColor : '#10b981'
    const secondaryColor = body.secondaryColor && isValidHex(body.secondaryColor) ? body.secondaryColor : '#6B7280'
    const accentColor = body.accentColor && isValidHex(body.accentColor) ? body.accentColor : '#f59e0b'

    // ── Check if user already exists ──────────────────────────────────
    const existing = await db.user.findUnique({ where: { email: body.email } })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // ── Hash password ─────────────────────────────────────────────────
    const passwordHash = await hashPassword(body.password)

    // ── Create user with agency/managed tier ──────────────────────────
    const user = await db.user.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
        role: 'agency' as UserRole,
        tier: 'managed',
        subscriptionStatus: 'trial', // Will be activated after manual review
        agencyName: body.agencyName,
        agencyLogoUrl: body.logo || null,
        agencyPrimaryColor: primaryColor,
        agencySecondaryColor: secondaryColor,
        agencyAccentColor: accentColor,
      },
    })

    // ── Create session token ──────────────────────────────────────────
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      name: user.name,
      tier: user.tier,
    })

    // ── Set HTTP-only cookie ──────────────────────────────────────────
    const response = NextResponse.json({
      success: true,
      message: "We'll contact you within 24 hours to set up your managed account.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tier: user.tier,
      },
      token,
    }, { status: 201 })

    response.cookies.set('seosights_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[Auth Register Agency] Error:', error)
    return NextResponse.json(
      { error: 'Agency registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
