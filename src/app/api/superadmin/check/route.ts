import { NextRequest, NextResponse } from 'next/server'

const SUPERADMIN_SECRET = process.env.SUPERADMIN_SECRET || 'seosights-superadmin-2024'

export async function GET(request: NextRequest) {
  try {
    // Option A: Check Authorization Bearer header
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      const bearerToken = authHeader.replace('Bearer ', '')
      if (bearerToken === SUPERADMIN_SECRET) {
        return NextResponse.json({
          authorized: true,
          user: {
            name: 'Super Admin',
            email: 'admin@seosights.io',
          },
        })
      }
    }

    // Option B: Check superadmin_key cookie
    const cookieKey = request.cookies.get('superadmin_key')?.value
    if (cookieKey && cookieKey === SUPERADMIN_SECRET) {
      return NextResponse.json({
        authorized: true,
        user: {
          name: 'Super Admin',
          email: 'admin@seosights.io',
        },
      })
    }

    return NextResponse.json({
      authorized: false,
      user: null,
    })
  } catch {
    return NextResponse.json({
      authorized: false,
      user: null,
    })
  }
}
