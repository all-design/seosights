import { NextRequest, NextResponse } from 'next/server'

const SUPERADMIN_SECRET = process.env.SUPERADMIN_SECRET || 'seosights-superadmin-2024'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret } = body

    if (!secret || typeof secret !== 'string') {
      return NextResponse.json(
        { error: 'Secret key is required' },
        { status: 400 }
      )
    }

    if (secret !== SUPERADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Invalid superadmin key' },
        { status: 401 }
      )
    }

    // Set httpOnly cookie with the secret
    const response = NextResponse.json({
      success: true,
      message: 'Authenticated successfully',
    })

    response.cookies.set('superadmin_key', secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return response
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
