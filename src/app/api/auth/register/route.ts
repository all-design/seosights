/**
 * Auth API — User Registration
 *
 * POST /api/auth/register
 *
 * Creates a new user account. Roles user/agency/affiliate can self-register.
 * Superadmin cannot be created via registration (set directly in DB).
 */

import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth'
import type { UserRole } from '@/lib/auth'

interface RegisterBody {
  email: string
  password: string
  name?: string
  role?: UserRole
  referralCode?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterBody

    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (body.password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles: UserRole[] = ['user', 'agency', 'affiliate']
    const role = body.role && validRoles.includes(body.role) ? body.role : 'user'

    const result = await registerUser({
      email: body.email,
      password: body.password,
      name: body.name,
      role,
      referralCode: body.referralCode,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: result.user,
      token: result.token,
    }, { status: 201 })

    response.cookies.set('seosights_session', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[Auth Register] Error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
