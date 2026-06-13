import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/approvals/[id]
 * Update a specific approval (approve/reject)
 * Body: { action: 'approve' | 'reject' }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
    }

    const status = action === 'approve' ? 'approved' : 'rejected'

    const approval = await db.approval.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
      },
    })

    return NextResponse.json({ approval })
  } catch (error) {
    console.error('[approvals] PUT error:', error instanceof Error ? error.message : 'Unknown')

    // Check if the error is a "not found" error
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Failed to update approval' },
      { status: 500 }
    )
  }
}
