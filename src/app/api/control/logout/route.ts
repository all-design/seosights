import { NextRequest, NextResponse } from 'next/server'

/**
 * Control Panel Logout
 *
 * POST /api/control/logout
 *
 * Clears the superadmin_key httpOnly cookie to end the AI Operations Center session.
 */
export async function POST(_request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, message: 'Logged out from Operations Center' })

    // Clear superadmin_key cookie (set by /api/superadmin/auth)
    response.cookies.set('superadmin_key', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[Control Logout] Error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}
