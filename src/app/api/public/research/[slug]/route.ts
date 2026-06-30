import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const revalidate = 300 // 5 minutes cache

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'X-RateLimit-Limit': '100',
  'X-RateLimit-Remaining': '99',
  'X-RateLimit-Reset': '300',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS })
}

/**
 * GET /api/public/research/[slug]
 * Get a single published research report by slug.
 * Returns full content + Observatory Score.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const report = await db.observatoryReport.findUnique({
      where: { slug, status: 'published' },
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        status: true,
        summary: true,
        keyFindings: true,
        contentMarkdown: true,
        contentJson: true,
        aiModels: true,
        categories: true,
        coverImageUrl: true,
        publishedAt: true,
        wordCount: true,
        readingTimeMin: true,
        researchQualityScore: true,
        evidenceScore: true,
        confidenceScore: true,
        freshnessScore: true,
        sampleSize: true,
        editorialScore: true,
        relatedChanges: true,
        relatedReports: true,
        createdAt: true,
      },
    })

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404, headers: CORS_HEADERS }
      )
    }

    const data = {
      ...report,
      keyFindings: report.keyFindings ? JSON.parse(report.keyFindings) : [],
      aiModels: report.aiModels ? JSON.parse(report.aiModels) : [],
      categories: report.categories ? JSON.parse(report.categories) : [],
      relatedChanges: report.relatedChanges ? JSON.parse(report.relatedChanges) : [],
      relatedReports: report.relatedReports ? JSON.parse(report.relatedReports) : [],
      contentJson: report.contentJson ? JSON.parse(report.contentJson) : null,
      publishedAt: report.publishedAt?.toISOString() || null,
      createdAt: report.createdAt.toISOString(),
      observatoryScore: {
        researchQuality: Math.round(report.researchQualityScore),
        evidence: Math.round(report.evidenceScore),
        confidence: Math.round(report.confidenceScore),
        freshness: Math.round(report.freshnessScore),
        sampleSize: report.sampleSize,
      },
    }

    return NextResponse.json(
      { success: true, data },
      { headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error('[public/research/[slug]] GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch report' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
