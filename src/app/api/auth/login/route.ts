/**
 * Auth API — Universal Login
 *
 * POST /api/auth/login
 *
 * Single login endpoint for all user types.
 * After successful login, role determines the dashboard redirect.
 */

import { NextRequest, NextResponse } from 'next/server'
import { loginUser } from '@/lib/auth'

interface LoginBody {
  email: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginBody

    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined

    const result = await loginUser({
      email: body.email,
      password: body.password,
      userAgent,
      ipAddress,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: result.user,
      token: result.token,
      redirectPath: getRoleRedirect(result.user!.role),
    })

    response.cookies.set('seosights_session', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[Auth Login] Error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}

function getRoleRedirect(role: string): string {
  switch (role) {
    case 'superadmin':
      return '#admin'
    case 'affiliate':
      return '#affiliate'
    case 'agency':
      return '#agency'
    default:
      return '#dashboard'
  }
}
