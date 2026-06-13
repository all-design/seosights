/**
 * White-Label PDF Download API Route
 *
 * GET /api/analysis/[id]/download-pdf
 *
 * Generates a premium branded PDF report using Puppeteer.
 * Pro/Managed users get their agency branding (logo, colors, name).
 * Free/Starter users get the default seosights branding.
 *
 * Query params:
 *   - userId: (required) The user ID for agency branding lookup
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateWhiteLabelPDF } from '@/lib/pdf-generator'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: analysisId } = await params
  const userId = req.nextUrl.searchParams.get('userId')

  if (!analysisId) {
    return NextResponse.json(
      { error: 'Analysis ID is required' },
      { status: 400 }
    )
  }

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required (pass as ?userId=...)' },
      { status: 400 }
    )
  }

  try {
    const pdfBuffer = await generateWhiteLabelPDF(analysisId, userId)

    const domain = analysisId.split('-')[0] || 'report'
    const filename = `seosights-report-${domain}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('[pdf-download] Generation failed:', error)

    const message =
      error instanceof Error ? error.message : 'Failed to generate PDF report'

    // Specific error codes
    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 })
    }

    if (message.includes('no results')) {
      return NextResponse.json(
        { error: 'Analysis is still running. Please wait for it to complete.' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate PDF report. Please try again.' },
      { status: 500 }
    )
  }
}
