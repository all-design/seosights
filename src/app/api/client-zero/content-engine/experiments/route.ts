import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/client-zero/content-engine/experiments
// List experiments with status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined

    const where = status ? { status } : {}

    const experiments = await db.contentExperiment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // If no experiments exist, return seed data
    if (experiments.length === 0 && !status) {
      const now = new Date()
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(now.getDate() - 30)
      const sixtyDaysAgo = new Date(now)
      sixtyDaysAgo.setDate(now.getDate() - 60)

      return NextResponse.json({
        experiments: [
          {
            id: 'seed-exp-1',
            keyword: 'AI Visibility for Dentists',
            versionATitle: 'AI Visibility for Dentists: Complete Guide',
            versionBTitle: 'How Dentists Can Improve AI Visibility in 2025',
            versionAArticleId: 'seed-article-a1',
            versionBArticleId: 'seed-article-b1',
            versionAScore: 14,
            versionBScore: 11,
            versionACitations: 5,
            versionBCitations: 3,
            versionAClicks: 312,
            versionBClicks: 245,
            winner: 'A',
            startedAt: sixtyDaysAgo.toISOString(),
            endsAt: thirtyDaysAgo.toISOString(),
            completedAt: thirtyDaysAgo.toISOString(),
            autoPromoted: true,
            status: 'completed',
            createdAt: sixtyDaysAgo.toISOString(),
          },
          {
            id: 'seed-exp-2',
            keyword: 'How to Get Cited by ChatGPT',
            versionATitle: 'How to Get Cited by ChatGPT: Expert Guide',
            versionBTitle: 'Getting ChatGPT to Cite Your Content (Proven Methods)',
            versionAArticleId: 'seed-article-a2',
            versionBArticleId: 'seed-article-b2',
            versionAScore: 0,
            versionBScore: 0,
            versionACitations: 0,
            versionBCitations: 0,
            versionAClicks: 89,
            versionBClicks: 76,
            winner: null,
            startedAt: now.toISOString(),
            endsAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            completedAt: null,
            autoPromoted: false,
            status: 'running',
            createdAt: now.toISOString(),
          },
          {
            id: 'seed-exp-3',
            keyword: 'SeoSights vs Surfer SEO',
            versionATitle: 'SeoSights vs Surfer SEO: Full Comparison',
            versionBTitle: 'Why SeoSights Outperforms Surfer SEO for AI Visibility',
            versionAArticleId: 'seed-article-a3',
            versionBArticleId: 'seed-article-b3',
            versionAScore: 0,
            versionBScore: 0,
            versionACitations: 0,
            versionBCitations: 0,
            versionAClicks: 156,
            versionBClicks: 178,
            winner: null,
            startedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            endsAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            completedAt: null,
            autoPromoted: false,
            status: 'running',
            createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      })
    }

    return NextResponse.json({ experiments })
  } catch (error) {
    console.error('[content-engine/experiments GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch experiments' },
      { status: 500 }
    )
  }
}

// POST /api/client-zero/content-engine/experiments
// Create experiment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keyword, versionAArticleId, versionBArticleId } = body as {
      keyword: string
      versionAArticleId: string
      versionBArticleId: string
    }

    if (!keyword || !versionAArticleId || !versionBArticleId) {
      return NextResponse.json(
        { error: 'keyword, versionAArticleId, and versionBArticleId are required' },
        { status: 400 }
      )
    }

    // Verify both articles exist
    const [articleA, articleB] = await Promise.all([
      db.contentArticle.findUnique({ where: { id: versionAArticleId } }),
      db.contentArticle.findUnique({ where: { id: versionBArticleId } }),
    ])

    if (!articleA) {
      return NextResponse.json(
        { error: `Article A (id: ${versionAArticleId}) not found` },
        { status: 404 }
      )
    }
    if (!articleB) {
      return NextResponse.json(
        { error: `Article B (id: ${versionBArticleId}) not found` },
        { status: 404 }
      )
    }

    // Auto-set endsAt to 30 days from now
    const now = new Date()
    const endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const experiment = await db.contentExperiment.create({
      data: {
        keyword,
        versionATitle: articleA.title,
        versionBTitle: articleB.title,
        versionAArticleId,
        versionBArticleId,
        startedAt: now,
        endsAt,
        status: 'running',
      },
    })

    // Update both articles with experiment ID
    await Promise.all([
      db.contentArticle.update({
        where: { id: versionAArticleId },
        data: { experimentId: experiment.id },
      }),
      db.contentArticle.update({
        where: { id: versionBArticleId },
        data: { experimentId: experiment.id },
      }),
    ])

    return NextResponse.json({
      experiment: {
        id: experiment.id,
        keyword: experiment.keyword,
        versionATitle: experiment.versionATitle,
        versionBTitle: experiment.versionBTitle,
        versionAArticleId: experiment.versionAArticleId,
        versionBArticleId: experiment.versionBArticleId,
        startedAt: experiment.startedAt,
        endsAt: experiment.endsAt,
        status: experiment.status,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[content-engine/experiments POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create experiment' },
      { status: 500 }
    )
  }
}
