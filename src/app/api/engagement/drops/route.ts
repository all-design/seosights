import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const domain = 'seosights.com'

    const drops = await db.engagementDrop.findMany({
      where: { domain },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ drops })
  } catch (error) {
    console.error('[engagement/drops] Error:', error)
    return NextResponse.json({ error: 'Failed to load drops' }, { status: 500 })
  }
}
