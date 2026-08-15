/**
 * Cron API — Auto-Promotion of Pending Reports & Articles (with Editorial Gates)
 *
 * GET /api/cron/promote-reports
 *
 * Schedule: Every hour (0 * * * *)
 * Purpose: Promotes ObservatoryReport records stuck in 'proposed' status
 *          and ContentArticle records stuck in 'review' status
 *          to 'published', but ONLY if they pass quality gates.
 *
 * Editorial Gates:
 * ────────────────
 * ObservatoryReport ('proposed' → 'published'):
 *   - Created more than 1 hour ago (allows human review window)
 *   - isSimulated = false (never auto-publish seed/dev data)
 *   - evidenceScore > 0 (has real evidence backing)
 *   - sampleSize > 0 (has actual data points)
 *   - Has backing ObservatoryResponse records (non-simulated)
 *   - editorialScore computed from real data quality, not hardcoded
 *
 * ContentArticle ('review' → 'published'):
 *   - Created more than 1 hour ago
 *   - Status must be 'review' — drafts are NEVER auto-promoted
 *   - Has actual content (not just a title)
 *   - Computed qualityScore >= 60 (from seoScore/aeoScore/geoScore)
 *
 * Safety: Maximum 5 promotions per run to prevent mass-publishing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

// ─── Configuration ──────────────────────────────────────────────────
const MAX_PROMOTIONS_PER_RUN = 5
const ARTICLE_QUALITY_THRESHOLD = 60
const MIN_EVIDENCE_SCORE = 1 // Must have > 0 evidence
const MIN_SAMPLE_SIZE = 1 // Must have at least 1 data point
const MIN_CONTENT_LENGTH = 50 // Articles must have substantive content

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // No secret → dev/sandbox mode

  const authHeader = request.headers.get('authorization') || ''
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i)
  if (bearerMatch && bearerMatch[1] === secret) return true

  const xHeader = request.headers.get('x-cron-secret')
  if (xHeader && xHeader === secret) return true

  // Vercel Cron Jobs send this header automatically
  const vercelHeader = request.headers.get('x-vercel-cron-secret')
  if (vercelHeader && vercelHeader === secret) return true

  return false
}

/**
 * Compute a quality score for a ContentArticle from its individual scores.
 * Uses the average of non-zero scores among seoScore, aeoScore, geoScore.
 * Returns 0 if no scores are present.
 */
function computeArticleQualityScore(seoScore: number, aeoScore: number, geoScore: number): number {
  const scores = [seoScore, aeoScore, geoScore].filter((s) => s > 0)
  if (scores.length === 0) return 0
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
}

/**
 * Compute editorialScore for an ObservatoryReport based on actual data quality.
 * Weighted blend: evidence (40%) + confidence (30%) + freshness (30%).
 * All inputs are 0-100, output is 0-1 (matching editorialScore Float field).
 */
function computeEditorialScore(
  evidenceScore: number,
  confidenceScore: number,
  freshnessScore: number,
): number {
  const raw = evidenceScore * 0.4 + confidenceScore * 0.3 + freshnessScore * 0.3
  // Normalize to 0-1 range (inputs are 0-100)
  return Math.min(1, Math.max(0, raw / 100))
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized — invalid or missing CRON_SECRET' },
      { status: 401 },
    )
  }

  const pipelineStart = Date.now()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  let promotedReports = 0
  let promotedArticles = 0
  const errors: string[] = []
  const promoted: { type: string; id: string; title: string; reason: string }[] = []
  const skipped: { type: string; id: string; title: string; reason: string }[] = []

  // ─── Step 1: ObservatoryReport 'proposed' → 'published' (with quality gate) ─
  try {
    const candidates = await db.observatoryReport.findMany({
      where: {
        status: 'proposed',
        createdAt: { lt: oneHourAgo },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        isSimulated: true,
        evidenceScore: true,
        confidenceScore: true,
        freshnessScore: true,
        sampleSize: true,
        relatedChanges: true,
        editorialScore: true,
      },
    })

    console.log(
      `[cron/promote-reports] Found ${candidates.length} ObservatoryReport candidates in 'proposed' status older than 1h`,
    )

    for (const report of candidates) {
      // Safety limit check
      if (promotedReports + promotedArticles >= MAX_PROMOTIONS_PER_RUN) {
        skipped.push({
          type: 'ObservatoryReport',
          id: report.id,
          title: report.title,
          reason: 'Safety limit reached — max promotions per run exceeded',
        })
        continue
      }

      // Gate 1: Never publish simulated/seed data
      if (report.isSimulated) {
        skipped.push({
          type: 'ObservatoryReport',
          id: report.id,
          title: report.title,
          reason: 'isSimulated=true — seed/dev data must never be auto-published',
        })
        continue
      }

      // Gate 2: Must have actual evidence
      if (report.evidenceScore < MIN_EVIDENCE_SCORE) {
        skipped.push({
          type: 'ObservatoryReport',
          id: report.id,
          title: report.title,
          reason: `evidenceScore=${report.evidenceScore} is below minimum ${MIN_EVIDENCE_SCORE} — no real evidence backing`,
        })
        continue
      }

      // Gate 3: Must have actual data points
      if (report.sampleSize < MIN_SAMPLE_SIZE) {
        skipped.push({
          type: 'ObservatoryReport',
          id: report.id,
          title: report.title,
          reason: `sampleSize=${report.sampleSize} is below minimum ${MIN_SAMPLE_SIZE} — no data points`,
        })
        continue
      }

      // Gate 4: Must have backing ObservatoryResponse records (non-simulated)
      let backingResponseCount = 0
      try {
        // Parse relatedChanges to find linked ObservatoryChange records → their crawls → responses
        const relatedChangeIds: string[] = report.relatedChanges
          ? JSON.parse(report.relatedChanges)
          : []

        if (relatedChangeIds.length > 0) {
          // Find the crawls associated with these changes
          const changes = await db.observatoryChange.findMany({
            where: { id: { in: relatedChangeIds } },
            select: { crawlId: true },
          })

          const crawlIds = [...new Set(changes.map((c) => c.crawlId))]

          if (crawlIds.length > 0) {
            // Count non-simulated responses from those crawls
            backingResponseCount = await db.observatoryResponse.count({
              where: {
                crawlId: { in: crawlIds },
                isSimulated: false,
              },
            })
          }
        }
      } catch (parseErr) {
        const msg = parseErr instanceof Error ? parseErr.message : 'Unknown parse error'
        console.warn(
          `[cron/promote-reports] Failed to check backing responses for report ${report.id}: ${msg}`,
        )
      }

      if (backingResponseCount === 0) {
        skipped.push({
          type: 'ObservatoryReport',
          id: report.id,
          title: report.title,
          reason:
            'No backing ObservatoryResponse records found — report has no real data supporting its findings',
        })
        continue
      }

      // All gates passed — compute editorialScore from real data quality
      const editorialScore = computeEditorialScore(
        report.evidenceScore,
        report.confidenceScore,
        report.freshnessScore,
      )

      // Promote
      await db.observatoryReport.update({
        where: { id: report.id },
        data: {
          status: 'published',
          editorialScore,
          editorialReason: `Auto-promoted: evidenceScore=${report.evidenceScore}, confidenceScore=${report.confidenceScore}, freshnessScore=${report.freshnessScore}, sampleSize=${report.sampleSize}, backingResponses=${backingResponseCount}`,
          publishedAt: new Date(),
        },
      })

      promotedReports++
      promoted.push({
        type: 'ObservatoryReport',
        id: report.id,
        title: report.title,
        reason: `editorialScore=${editorialScore.toFixed(2)}, backingResponses=${backingResponseCount}`,
      })

      console.log(
        `[cron/promote-reports] ✓ Promoted ObservatoryReport "${report.title}" (${report.id}) — editorialScore=${editorialScore.toFixed(2)}, backingResponses=${backingResponseCount}`,
      )
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    errors.push(`ObservatoryReport promotion failed: ${msg}`)
    console.error('[cron/promote-reports] ObservatoryReport promotion error:', msg)
  }

  // ─── Step 2: ContentArticle 'review' → 'published' (with quality gate) ────
  // IMPORTANT: Only articles in 'review' status are eligible.
  // Drafts are NEVER auto-promoted — they must go through human review first.
  try {
    const candidates = await db.contentArticle.findMany({
      where: {
        status: 'review',
        createdAt: { lt: oneHourAgo },
      },
      select: {
        id: true,
        title: true,
        content: true,
        wordCount: true,
        seoScore: true,
        aeoScore: true,
        geoScore: true,
      },
    })

    console.log(
      `[cron/promote-reports] Found ${candidates.length} ContentArticle candidates in 'review' status older than 1h`,
    )

    for (const article of candidates) {
      // Safety limit check
      if (promotedReports + promotedArticles >= MAX_PROMOTIONS_PER_RUN) {
        skipped.push({
          type: 'ContentArticle',
          id: article.id,
          title: article.title,
          reason: 'Safety limit reached — max promotions per run exceeded',
        })
        continue
      }

      // Gate 1: Must have actual content (not just a title)
      const contentLength = article.content?.trim().length ?? 0
      if (contentLength < MIN_CONTENT_LENGTH) {
        skipped.push({
          type: 'ContentArticle',
          id: article.id,
          title: article.title,
          reason: `Content length=${contentLength} is below minimum ${MIN_CONTENT_LENGTH} — article has no substantive content`,
        })
        continue
      }

      // Gate 2: wordCount must be > 0 (sanity check)
      if (article.wordCount <= 0) {
        skipped.push({
          type: 'ContentArticle',
          id: article.id,
          title: article.title,
          reason: `wordCount=${article.wordCount} — article appears empty`,
        })
        continue
      }

      // Gate 3: Quality score must meet threshold
      const qualityScore = computeArticleQualityScore(
        article.seoScore,
        article.aeoScore,
        article.geoScore,
      )
      if (qualityScore < ARTICLE_QUALITY_THRESHOLD) {
        skipped.push({
          type: 'ContentArticle',
          id: article.id,
          title: article.title,
          reason: `qualityScore=${qualityScore} (seo=${article.seoScore}, aeo=${article.aeoScore}, geo=${article.geoScore}) is below threshold ${ARTICLE_QUALITY_THRESHOLD}`,
        })
        continue
      }

      // All gates passed — promote
      await db.contentArticle.update({
        where: { id: article.id },
        data: {
          status: 'published',
          publishedAt: new Date(),
        },
      })

      promotedArticles++
      promoted.push({
        type: 'ContentArticle',
        id: article.id,
        title: article.title,
        reason: `qualityScore=${qualityScore}, wordCount=${article.wordCount}`,
      })

      console.log(
        `[cron/promote-reports] ✓ Promoted ContentArticle "${article.title}" (${article.id}) — qualityScore=${qualityScore}, wordCount=${article.wordCount}`,
      )
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    errors.push(`ContentArticle promotion failed: ${msg}`)
    console.error('[cron/promote-reports] ContentArticle promotion error:', msg)
  }

  // ─── Summary Logging ───────────────────────────────────────────────────
  const totalPromoted = promotedReports + promotedArticles
  const totalSkipped = skipped.length

  if (skipped.length > 0) {
    console.log(`[cron/promote-reports] Skipped ${totalSkipped} items:`)
    for (const s of skipped) {
      console.log(`  ✗ ${s.type} "${s.title}" (${s.id}): ${s.reason}`)
    }
  }

  const totalDurationMs = Date.now() - pipelineStart

  console.log(
    `[cron/promote-reports] Run complete: promoted=${totalPromoted} (reports=${promotedReports}, articles=${promotedArticles}), skipped=${totalSkipped}, errors=${errors.length}, duration=${totalDurationMs}ms`,
  )

  return NextResponse.json({
    success: true,
    pipeline: 'promote-reports',
    schedule: 'Every hour (0 * * * *)',
    timestamp: new Date().toISOString(),
    promoted: {
      observatoryReports: promotedReports,
      contentArticles: promotedArticles,
      total: totalPromoted,
      details: promoted,
    },
    skipped: {
      total: totalSkipped,
      details: skipped,
    },
    gates: {
      maxPromotionsPerRun: MAX_PROMOTIONS_PER_RUN,
      articleQualityThreshold: ARTICLE_QUALITY_THRESHOLD,
      minEvidenceScore: MIN_EVIDENCE_SCORE,
      minSampleSize: MIN_SAMPLE_SIZE,
      minContentLength: MIN_CONTENT_LENGTH,
    },
    errors,
    totalDurationMs,
  })
}
