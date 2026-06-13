/**
 * Auth API — Logout
 *
 * POST /api/auth/logout
 *
 * Invalidates the current session.
 */

import { NextRequest, NextResponse } from 'next/server'
import { logoutUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const token =
      request.cookies.get('seosights_session')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '')

    if (token) {
      await logoutUser(token)
    }

    const response = NextResponse.json({ success: true, message: 'Logged out' })

    // Clear session cookie
    response.cookies.set('seosights_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[Auth Logout] Error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}
