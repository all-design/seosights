// ─── AGE Measurement Engine ──────────────────────────────────────────
// Measures results of published assets using REAL database data sources.
//
// Data sources:
//   - VisibilitySnapshot → aiVisibilityDelta (real score change between last 2 snapshots)
//   - CitationEvent      → citations7d (count of 'cited'/'rank_up'/'first_mention' events)
//   - CitationRecord     → citations7d (supplementary count of records citing the domain)
//   - Traffic/impressions/clicks → ESTIMATED from citations + visibility (no GA API available)
//   - GrowthLearning     → prediction errors computed from actual measured values
//
// Fallback: zero values when no real data is available (never Math.random)

import { db } from '../../../src/lib/db'

// ─── Helpers ──────────────────────────────────────────────────────────

/** Extract hostname from a URL string; returns null on failure */
function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return parsed.hostname
  } catch {
    // Might be a bare domain like "example.com" — try prepending https
    try {
      const parsed = new URL(`https://${url}`)
      return parsed.hostname
    } catch {
      return null
    }
  }
}

// ─── Real Data Queries ───────────────────────────────────────────────

/**
 * Query VisibilitySnapshot for a domain and compute the AI visibility delta
 * between the two most recent snapshots. Returns 0 if fewer than 2 snapshots.
 */
async function computeVisibilityDelta(domain: string): Promise<number> {
  const snapshots = await db.visibilitySnapshot.findMany({
    where: { domain },
    orderBy: { capturedAt: 'desc' },
    take: 2,
    select: { overallScore: true },
  })

  if (snapshots.length < 2) {
    // Only one (or zero) snapshots — no delta to compute
    if (snapshots.length === 1) {
      // Single snapshot: visibility delta is the score itself relative to 0
      return snapshots[0].overallScore / 100 // normalise to ~0-1 range
    }
    return 0
  }

  // Delta = latest score minus previous score, normalised to -1..+1 range
  const delta = (snapshots[0].overallScore - snapshots[1].overallScore) / 100
  return Math.round(delta * 100) / 100
}

/**
 * Query CitationEvent for a domain in the last 7 days.
 * Counts events that represent positive citation signals:
 *   'cited', 'rank_up', 'first_mention'
 */
async function countCitationEvents(domain: string, since: Date): Promise<number> {
  const count = await db.citationEvent.count({
    where: {
      domain,
      eventType: { in: ['cited', 'rank_up', 'first_mention'] },
      createdAt: { gte: since },
    },
  })
  return count
}

/**
 * Query CitationRecord for a domain in the last 7 days.
 * Each record represents an AI model citing this domain.
 */
async function countCitationRecords(domain: string, since: Date): Promise<number> {
  const count = await db.citationRecord.count({
    where: {
      citedDomain: domain,
      crawlDate: { gte: since },
    },
  })
  return count
}

/**
 * Get the latest VisibilitySnapshot overallScore for a domain.
 * Returns 0 if no snapshot exists.
 */
async function getLatestVisibilityScore(domain: string): Promise<number> {
  const snapshot = await db.visibilitySnapshot.findFirst({
    where: { domain },
    orderBy: { capturedAt: 'desc' },
    select: { overallScore: true },
  })
  return snapshot?.overallScore ?? 0
}

/**
 * Get the most recent GrowthLearning prediction for an asset.
 * This was created by the planning/prediction engine and contains
 * predictedTraffic, predictedCitations, predictedVisibility, predictedValue.
 */
async function getLatestPrediction(assetId: string) {
  return db.growthLearning.findFirst({
    where: { assetId },
    orderBy: { createdAt: 'desc' },
    select: {
      predictedTraffic: true,
      predictedCitations: true,
      predictedVisibility: true,
      predictedValue: true,
      predictionConfidence: true,
    },
  })
}

// ─── Estimation Functions ─────────────────────────────────────────────
// We don't have Google Analytics API access, so we estimate traffic signals
// from real citation and visibility data. These are clearly marked as estimates.

/**
 * Estimate 24h traffic from citations and visibility.
 *
 * Heuristic (documented):
 *   - Each citation typically drives ~15-40 visits/day depending on authority
 *   - Higher visibility → higher CTR from AI answers → more traffic
 *   - Formula: basePerCitation * citations + visibilityMultiplier * visibilityScore
 */
function estimateTraffic24h(citations7d: number, visibilityScore: number): number {
  // Daily citation rate (7d count → daily average)
  const dailyCitations = citations7d / 7

  // Base traffic per daily citation (conservative estimate)
  const basePerCitation = 25

  // Visibility bonus: each point of visibility score adds ~0.5 visits/day
  const visibilityBonus = visibilityScore * 0.5

  const estimated = Math.round(dailyCitations * basePerCitation + visibilityBonus)
  return estimated
}

/**
 * Estimate 24h impressions from traffic and visibility.
 *
 * Heuristic: impressions ≈ traffic × impressionMultiplier
 *   - AI-generated answer impressions are typically 5-10× the click-through traffic
 *   - Higher visibility means more impressions per click
 */
function estimateImpressions24h(traffic24h: number, visibilityScore: number): number {
  const impressionMultiplier = 5 + (visibilityScore / 100) * 5 // 5× to 10×
  return Math.round(traffic24h * impressionMultiplier)
}

/**
 * Estimate 24h clicks from traffic.
 *
 * Heuristic: clicks ≈ traffic × clickRate
 *   - Not all traffic results in a measurable "click" (some is direct AI answer consumption)
 *   - Conservative click rate: 30-60% depending on visibility
 */
function estimateClicks24h(traffic24h: number, visibilityScore: number): number {
  const clickRate = 0.3 + (visibilityScore / 100) * 0.3 // 30% to 60%
  return Math.round(traffic24h * clickRate)
}

/**
 * Estimate 7d conversions from citations and traffic.
 *
 * Heuristic: conversionRate ≈ 1-3% of traffic, higher with more citations
 *   (citations build trust → higher conversion)
 */
function estimateConversions7d(traffic24h: number, citations7d: number): number {
  const dailyTraffic = traffic24h
  const weeklyTraffic = dailyTraffic * 7
  const baseConversionRate = 0.01
  const citationBonusRate = Math.min(citations7d * 0.002, 0.02) // up to +2%
  const conversionRate = baseConversionRate + citationBonusRate
  return Math.round(weeklyTraffic * conversionRate)
}

// ─── Prediction Error Computation ─────────────────────────────────────

interface PredictionData {
  predictedTraffic: number
  predictedCitations: number
  predictedVisibility: number
  predictedValue: number
  predictionConfidence: number
}

interface ActualData {
  traffic24h: number
  citations7d: number
  aiVisibilityDelta: number
  platformValue: number
}

/**
 * Compute mean absolute percentage error (MAPE) between predicted and actual.
 * Returns { error: number, direction: 'accurate' | 'over' | 'under' }
 */
function computePredictionError(
  predicted: number,
  actual: number,
): { error: number; direction: 'accurate' | 'over' | 'under' } {
  if (actual === 0 && predicted === 0) return { error: 0, direction: 'accurate' }
  if (actual === 0) return { error: 1, direction: 'over' } // predicted something, got nothing

  const mape = Math.abs(predicted - actual) / Math.abs(actual)

  if (mape < 0.1) return { error: Math.round(mape * 100) / 100, direction: 'accurate' }
  if (predicted > actual) return { error: Math.round(mape * 100) / 100, direction: 'over' }
  return { error: Math.round(mape * 100) / 100, direction: 'under' }
}

// ─── Underperforming Thresholds ───────────────────────────────────────
// An asset is underperforming if it meets ANY of these criteria after 7+ days

const UNDERPERFORMING_THRESHOLDS = {
  minAgeDays: 7,
  maxTraffic24h: 5,        // less than 5 visits/day after a week
  maxCitations7d: 0,       // zero citations after a week
  minVisibilityDelta: -0.5, // visibility dropped by more than 0.5
}

function isUnderperforming(
  asset: { publishedAt: Date | null; traffic24h: number; citations7d: number; aiVisibilityDelta: number },
): boolean {
  if (!asset.publishedAt) return false

  const ageDays = (Date.now() - asset.publishedAt.getTime()) / (24 * 60 * 60 * 1000)
  if (ageDays < UNDERPERFORMING_THRESHOLDS.minAgeDays) return false // too new to judge

  return (
    asset.traffic24h < UNDERPERFORMING_THRESHOLDS.maxTraffic24h ||
    asset.citations7d <= UNDERPERFORMING_THRESHOLDS.maxCitations7d ||
    asset.aiVisibilityDelta < UNDERPERFORMING_THRESHOLDS.minVisibilityDelta
  )
}

// ─── Main Engine ──────────────────────────────────────────────────────

export async function runMeasurementEngine(): Promise<{ measured: number }> {
  console.log(`[Measurement] ${new Date().toISOString()} — Running measurement engine...`)

  // Find recently published assets (last 24h)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const recentAssets = await db.growthAsset.findMany({
    where: {
      publishedAt: { gte: yesterday },
      executionStatus: 'indexed',
    },
    take: 20,
  })

  let measured = 0

  for (const asset of recentAssets) {
    // ── Step 1: Extract domain from publishedUrl ──
    const domain = extractDomain(asset.publishedUrl)

    // ── Step 2: Query real data if we have a domain ──
    let aiVisibilityDelta = 0
    let citations7d = 0
    let visibilityScore = 0

    if (domain) {
      // Real visibility delta from VisibilitySnapshot
      aiVisibilityDelta = await computeVisibilityDelta(domain)

      // Real citation count from CitationEvent (positive signals only)
      const citationEventCount = await countCitationEvents(domain, sevenDaysAgo)

      // Real citation count from CitationRecord (AI model citations)
      const citationRecordCount = await countCitationRecords(domain, sevenDaysAgo)

      // Take the larger of the two — they measure different aspects
      citations7d = Math.max(citationEventCount, citationRecordCount)

      // Latest visibility score for estimation formulas
      visibilityScore = await getLatestVisibilityScore(domain)
    }
    // If no domain, all values remain 0 (no fake data)

    // ── Step 3: Estimate traffic/impressions/clicks from real data ──
    // These are ESTIMATES based on citations + visibility (no GA API available)
    const traffic24h = estimateTraffic24h(citations7d, visibilityScore)
    const impressions24h = estimateImpressions24h(traffic24h, visibilityScore)
    const clicks24h = estimateClicks24h(traffic24h, visibilityScore)
    const conversions7d = estimateConversions7d(traffic24h, citations7d)

    // ── Step 4: Determine underperforming status ──
    const underperforming = isUnderperforming({
      publishedAt: asset.publishedAt,
      traffic24h,
      citations7d,
      aiVisibilityDelta,
    })

    // ── Step 5: Update asset with real measurement data ──
    await db.growthAsset.update({
      where: { id: asset.id },
      data: {
        traffic24h,
        impressions24h,
        clicks24h,
        citations7d,
        aiVisibilityDelta,
        conversions7d,
        isUnderperforming: underperforming,
      },
    })

    // ── Step 6: Create learning record with prediction accuracy ──
    // Find the most recent prediction for this asset (from the planning engine)
    const prediction = await getLatestPrediction(asset.id)

    if (prediction) {
      // Compute prediction errors from actual measured values
      const actualTraffic = traffic24h
      const actualCitations = citations7d
      const actualVisibility = aiVisibilityDelta
      const actualValue = asset.platformValue

      const trafficError = computePredictionError(prediction.predictedTraffic, actualTraffic)
      const citationError = computePredictionError(prediction.predictedCitations, actualCitations)
      const visibilityError = computePredictionError(prediction.predictedVisibility, actualVisibility)
      const valueError = computePredictionError(prediction.predictedValue, actualValue)

      // Overall prediction error: average of individual MAPEs
      const overallError = Math.round(
        ((trafficError.error + citationError.error + visibilityError.error + valueError.error) / 4) * 100,
      ) / 100

      // Overall direction: majority vote
      const directions = [trafficError.direction, citationError.direction, visibilityError.direction, valueError.direction]
      const overCount = directions.filter((d) => d === 'over').length
      const underCount = directions.filter((d) => d === 'under').length
      const overallDirection: 'accurate' | 'over' | 'under' =
        overCount > underCount ? 'over' : underCount > overCount ? 'under' : 'accurate'

      // Generate lesson learned string
      const lessonParts: string[] = []
      if (trafficError.error > 0.3) lessonParts.push(`Traffic prediction ${trafficError.direction} by ${Math.round(trafficError.error * 100)}%`)
      if (citationError.error > 0.3) lessonParts.push(`Citation prediction ${citationError.direction} by ${Math.round(citationError.error * 100)}%`)
      if (visibilityError.error > 0.3) lessonParts.push(`Visibility prediction ${visibilityError.direction} by ${Math.round(visibilityError.error * 100)}%`)
      const lessonLearned = lessonParts.length > 0 ? lessonParts.join('; ') : 'Predictions within acceptable range'

      await db.growthLearning.create({
        data: {
          assetId: asset.id,
          predictedTraffic: prediction.predictedTraffic,
          predictedCitations: prediction.predictedCitations,
          predictedVisibility: prediction.predictedVisibility,
          predictedValue: prediction.predictedValue,
          predictionConfidence: prediction.predictionConfidence,
          actualTraffic,
          actualCitations,
          actualVisibility,
          actualValue,
          predictionError: overallError,
          errorDirection: overallDirection,
          lessonLearned,
          measuredAt: new Date(),
        },
      })
    } else {
      // No prior prediction exists — record actuals with zero predictions
      // This is the first measurement for this asset
      await db.growthLearning.create({
        data: {
          assetId: asset.id,
          predictedTraffic: 0,
          predictedCitations: 0,
          predictedVisibility: 0,
          predictedValue: 0,
          predictionConfidence: 0,
          actualTraffic: traffic24h,
          actualCitations: citations7d,
          actualVisibility: aiVisibilityDelta,
          actualValue: asset.platformValue,
          predictionError: 0,
          errorDirection: null,
          lessonLearned: 'First measurement — no prior prediction to compare against',
          measuredAt: new Date(),
        },
      })
    }

    measured++
  }

  console.log(`[Measurement] ${new Date().toISOString()} — Measured ${measured} assets`)
  return { measured }
}
