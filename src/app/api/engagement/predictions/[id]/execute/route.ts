import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const prediction = await db.engagementPrediction.findUnique({
      where: { id },
    })

    if (!prediction) {
      return NextResponse.json({ error: 'Prediction not found' }, { status: 404 })
    }

    if (prediction.status !== 'pending') {
      return NextResponse.json(
        { error: 'Prediction is not in pending status' },
        { status: 400 }
      )
    }

    const updated = await db.engagementPrediction.update({
      where: { id },
      data: {
        status: 'executed',
        userExecuted: true,
        executedAt: new Date(),
      },
    })

    return NextResponse.json({ prediction: updated })
  } catch (error) {
    console.error('[engagement/predictions/execute] Error:', error)
    return NextResponse.json({ error: 'Failed to execute prediction' }, { status: 500 })
  }
}
