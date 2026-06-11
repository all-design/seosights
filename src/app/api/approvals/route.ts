import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/approvals?analysisId=xxx
 * Fetch pending approvals for a given analysis
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const analysisId = searchParams.get('analysisId')
    const status = searchParams.get('status') || 'pending'

    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId is required' }, { status: 400 })
    }

    const approvals = await db.approval.findMany({
      where: {
        analysisId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ approvals })
  } catch (error) {
    console.error('[approvals] GET error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to fetch approvals' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/approvals
 * Submit approval decision (approve/reject) for one or more approvals
 * Body: { approvalIds: string[], action: 'approve' | 'reject' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { approvalIds, action } = body

    if (!approvalIds || !Array.isArray(approvalIds) || approvalIds.length === 0) {
      return NextResponse.json({ error: 'approvalIds is required' }, { status: 400 })
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
    }

    const status = action === 'approve' ? 'approved' : 'rejected'

    const results = []
    for (const id of approvalIds) {
      try {
        const updated = await db.approval.update({
          where: { id },
          data: {
            status,
            reviewedAt: new Date(),
          },
        })
        results.push(updated)
      } catch (err) {
        console.warn(`[approvals] Failed to update approval ${id}:`, err instanceof Error ? err.message : 'Unknown')
      }
    }

    return NextResponse.json({ updated: results.length, approvals: results })
  } catch (error) {
    console.error('[approvals] POST error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to update approvals' },
      { status: 500 }
    )
  }
}
