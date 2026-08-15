// ─── Observatory Reviewer ────────────────────────────────────
// Reviews research integrity: methodology, confidence, evidence
// Score: calculated dynamically from real DB data

import { db } from '../../../src/lib/db'

interface ReviewerResult {
  reviewer: string
  score: number
  issues: number
  summary: string
  recommendations: string[]
  details: Record<string, unknown>
}

export async function runObservatoryReviewer(): Promise<ReviewerResult> {
  console.log('[QA:Observatory] Starting research integrity review...')

  const currentRun = await db.qARun.findFirst({
    where: { status: 'running' },
    orderBy: { startedAt: 'desc' },
  })

  const runId = currentRun?.id ?? ''
  let issueCount = 0

  // ── 1. Gather real DB data ──────────────────────────────────────
  const [
    totalReports,
    totalResponses,
    totalChanges,
    totalCitations,
    allModels,
    activeModels,
    simulatedResponses,
    recentCitations,
    signals,
    latestResponse,
    latestCrawl,
    reportScores,
    lowConfidenceCitations,
    staleChanges,
  ] = await Promise.all([
    db.observatoryReport.count(),
    db.observatoryResponse.count(),
    db.observatoryChange.count(),
    db.citationRecord.count(),
    db.aIModelRegistry.findMany(),
    db.aIModelRegistry.findMany({ where: { isActive: true } }),
    db.observatoryResponse.findMany({
      where: { isSimulated: true },
      select: { id: true, aiModel: true, promptCategory: true },
    }),
    db.citationRecord.findMany({
      orderBy: { crawlDate: 'desc' },
      take: 100,
      select: { confidence: true, crawlDate: true, aiModel: true },
    }),
    db.observatoryChange.findMany({
      where: { isSignal: true },
      select: { significanceScore: true, changeType: true, aiModel: true, createdAt: true },
    }),
    db.observatoryResponse.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
    db.observatoryCrawl.findFirst({
      orderBy: { startedAt: 'desc' },
      select: { startedAt: true, completedAt: true },
    }),
    db.observatoryReport.findMany({
      where: { status: 'published' },
      select: { evidenceScore: true, confidenceScore: true, freshnessScore: true, researchQualityScore: true },
    }),
    db.citationRecord.findMany({
      where: { confidence: { lt: 0.5 } },
      select: { id: true, confidence: true, aiModel: true, promptCategory: true },
    }),
    db.observatoryChange.findMany({
      where: {
        isSignal: true,
        significanceScore: { lt: 0.4 },
      },
      select: { id: true, significanceScore: true, changeType: true },
    }),
  ])

  // ── 2. Calculate score from real data ──────────────────────────
  const now = new Date()
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

  const hasAnyData = totalReports > 0 || totalResponses > 0 || totalChanges > 0 || totalCitations > 0

  // Component A: Data coverage (0-25) — how much data we have
  let dataCoverageScore = 0
  if (hasAnyData) {
    // Logarithmic scaling: decent volume = full marks
    const reportComponent = Math.min(10, Math.log2(totalReports + 1) * 2.5)
    const responseComponent = Math.min(8, Math.log2(totalResponses + 1) * 1.5)
    const citationComponent = Math.min(7, Math.log2(totalCitations + 1) * 1.2)
    dataCoverageScore = Math.round((reportComponent + responseComponent + citationComponent) * 10) / 10
  }

  // Component B: Model coverage (0-25) — how many AI models are active
  let modelCoverageScore = 0
  const totalModelCount = allModels.length
  const activeModelCount = activeModels.length
  if (totalModelCount > 0) {
    // Full marks for having 6+ active models, proportional otherwise
    modelCoverageScore = Math.min(25, Math.round((activeModelCount / Math.max(totalModelCount, 6)) * 25 * 10) / 10)
  }

  // Component C: Recency of data (0-25) — how fresh the data is
  let recencyScore = 0
  if (latestResponse?.createdAt) {
    const ageMs = now.getTime() - latestResponse.createdAt.getTime()
    if (ageMs < SEVEN_DAYS) {
      recencyScore = 25
    } else if (ageMs < THIRTY_DAYS) {
      recencyScore = Math.round((25 * (1 - (ageMs - SEVEN_DAYS) / (THIRTY_DAYS - SEVEN_DAYS))) * 10) / 10
    } else {
      // Older than 30 days: decay from ~5 to 0 over 60 days
      const sixtyDays = 60 * 24 * 60 * 60 * 1000
      recencyScore = Math.max(0, Math.round(5 * (1 - (ageMs - THIRTY_DAYS) / sixtyDays) * 10) / 10)
    }
  }

  // Component D: Evidence quality (0-25) — confidence, evidence scores
  let evidenceQualityScore = 0
  if (reportScores.length > 0) {
    const avgEvidence = reportScores.reduce((s, r) => s + r.evidenceScore, 0) / reportScores.length
    const avgConfidence = reportScores.reduce((s, r) => s + r.confidenceScore, 0) / reportScores.length
    const avgFreshness = reportScores.reduce((s, r) => s + r.freshnessScore, 0) / reportScores.length
    // Each is 0-100, normalize to 0-25 range with weighting
    evidenceQualityScore = Math.round(((avgEvidence * 0.35 + avgConfidence * 0.35 + avgFreshness * 0.3) / 100 * 25) * 10) / 10
  } else if (recentCitations.length > 0) {
    // Fallback: use citation confidence if no reports
    const avgCitationConf = recentCitations.reduce((s, c) => s + (c.confidence ?? 0), 0) / recentCitations.length
    evidenceQualityScore = Math.round(avgCitationConf * 25 * 10) / 10
  }

  const score = Math.round(dataCoverageScore + modelCoverageScore + recencyScore + evidenceQualityScore)

  // ── 3. Build dynamic issues from real data ─────────────────────
  const issues: Array<{
    title: string
    description: string
    page: string
    element: string
    severity: 'critical' | 'medium' | 'minor'
    evidence: string
    expectedBehavior: string
    actualBehavior: string
    userImpact: string
    businessImpact: string
    fixSuggestion: string
  }> = []

  // Issue: Stale AI models (lastCrawledAt older than 7 days)
  const staleModels = activeModels.filter(m => {
    if (!m.lastCrawledAt) return true // never crawled = stale
    return (now.getTime() - m.lastCrawledAt.getTime()) > SEVEN_DAYS
  })
  if (staleModels.length > 0) {
    const staleNames = staleModels.map(m => m.displayName).join(', ')
    const neverCrawled = staleModels.filter(m => !m.lastCrawledAt)
    const daysStale = staleModels.map(m => {
      if (!m.lastCrawledAt) return Infinity
      return Math.round((now.getTime() - m.lastCrawledAt.getTime()) / (24 * 60 * 60 * 1000))
    })
    const maxDays = Math.max(...daysStale.filter(d => d !== Infinity))
    issues.push({
      title: `${staleModels.length} active AI model${staleModels.length > 1 ? 's' : ''} not crawled in 7+ days`,
      description: `The following active models have stale crawl data: ${staleNames}. ${neverCrawled.length > 0 ? `${neverCrawled.length} have never been crawled. ` : ''}The oldest was crawled ${maxDays === Infinity ? 'never' : `${maxDays} days ago`}. Stale model data means Observatory scores and reports may be based on outdated AI behavior, reducing the reliability of change detection and citation tracking.`,
      page: '/observatory',
      element: 'AIModelRegistry, crawl scheduler',
      severity: staleModels.length >= activeModelCount ? 'critical' : 'medium',
      evidence: JSON.stringify({
        staleModels: staleModels.map(m => ({
          model: m.displayName,
          lastCrawled: m.lastCrawledAt?.toISOString() ?? 'never',
          daysStale: m.lastCrawledAt ? Math.round((now.getTime() - m.lastCrawledAt.getTime()) / (24 * 60 * 60 * 1000)) : 'never',
        })),
        threshold: '7 days',
        activeModelCount,
      }),
      expectedBehavior: 'All active AI models should be crawled at least every 7 days',
      actualBehavior: `${staleModels.length} of ${activeModelCount} active models have stale data`,
      userImpact: staleModels.length >= activeModelCount ? 'high' : 'medium',
      businessImpact: 'reputation',
      fixSuggestion: 'Trigger immediate crawl for stale models. Review crawl scheduler configuration and increase crawl frequency if needed.',
    })
  }

  // Issue: Simulated data in production
  if (simulatedResponses.length > 0) {
    const simulatedModels = Array.from(new Set(simulatedResponses.map(r => r.aiModel)))
    const simulatedCategories = Array.from(new Set(simulatedResponses.map(r => r.promptCategory)))
    issues.push({
      title: `${simulatedResponses.length} simulated responses present in Observatory data`,
      description: `Found ${simulatedResponses.length} ObservatoryResponse entries flagged as isSimulated=true. These are seed/dev data and should NEVER be used in published reports or score calculations. Affected models: ${simulatedModels.join(', ')}. Affected categories: ${simulatedCategories.join(', ')}. If these are included in production aggregations, all scores and findings are unreliable.`,
      page: '/observatory',
      element: 'ObservatoryResponse.isSimulated, report generation pipeline',
      severity: 'critical',
      evidence: JSON.stringify({
        count: simulatedResponses.length,
        models: simulatedModels,
        categories: simulatedCategories,
        sampleIds: simulatedResponses.slice(0, 5).map(r => r.id),
      }),
      expectedBehavior: 'No simulated data should be present in production; all responses should be real AI model outputs',
      actualBehavior: `${simulatedResponses.length} simulated responses exist in the database`,
      userImpact: 'high',
      businessImpact: 'reputation',
      fixSuggestion: 'Delete simulated responses from production database or add isSimulated=false filter to ALL aggregation queries. Add a pre-publish check that rejects any report using simulated data.',
    })
  }

  // Issue: Low-data prompt categories (sparse coverage)
  const categoryCounts = new Map<string, number>()
  // Use groupBy-style aggregation via raw responses
  const responsesForCategory = await db.observatoryResponse.findMany({
    select: { promptCategory: true },
  })
  for (const r of responsesForCategory) {
    categoryCounts.set(r.promptCategory, (categoryCounts.get(r.promptCategory) ?? 0) + 1)
  }
  const lowDataThreshold = 20
  const lowDataCategories = Array.from(categoryCounts.entries())
    .filter(([, count]) => count < lowDataThreshold)
    .sort((a, b) => a[1] - b[1])
  if (lowDataCategories.length > 0) {
    issues.push({
      title: `${lowDataCategories.length} prompt categories have fewer than ${lowDataThreshold} responses`,
      description: `The following prompt categories have sparse data: ${lowDataCategories.map(([cat, count]) => `"${cat}" (${count} responses)`).join(', ')}. With fewer than ${lowDataThreshold} data points, confidence intervals are too wide and scores are unreliable. These categories may show authoritative-looking scores that are actually meaningless.`,
      page: '/observatory',
      element: 'ObservatoryResponse aggregation, confidence interval calculations',
      severity: lowDataCategories.length >= 3 ? 'medium' : 'minor',
      evidence: JSON.stringify({
        lowDataCategories: lowDataCategories.map(([cat, count]) => ({ category: cat, responseCount: count })),
        threshold: lowDataThreshold,
        totalCategories: categoryCounts.size,
      }),
      expectedBehavior: `All prompt categories should have at least ${lowDataThreshold} responses for reliable scoring`,
      actualBehavior: `${lowDataCategories.length} of ${categoryCounts.size} categories fall below the threshold`,
      userImpact: 'medium',
      businessImpact: 'reputation',
      fixSuggestion: `Increase crawl coverage for under-represented categories. Add "Low confidence" badge for categories with <${lowDataThreshold} responses. Suppress ranking comparisons for sparse categories.`,
    })
  }

  // Issue: Low-confidence citations
  if (lowConfidenceCitations.length > 0) {
    const avgLowConf = lowConfidenceCitations.reduce((s, c) => s + c.confidence, 0) / lowConfidenceCitations.length
    const affectedModels = Array.from(new Set(lowConfidenceCitations.map(c => c.aiModel)))
    issues.push({
      title: `${lowConfidenceCitations.length} citations with confidence below 0.5`,
      description: `Found ${lowConfidenceCitations.length} CitationRecord entries with confidence < 0.5 (average: ${avgLowConf.toFixed(2)}). Low-confidence citations indicate the AI model was uncertain, making the citation unreliable as evidence. Affected models: ${affectedModels.join(', ')}. These citations may be hallucinated or based on outdated information.`,
      page: '/observatory',
      element: 'CitationRecord confidence scoring, evidence pipeline',
      severity: lowConfidenceCitations.length > totalCitations * 0.2 ? 'medium' : 'minor',
      evidence: JSON.stringify({
        count: lowConfidenceCitations.length,
        avgConfidence: Math.round(avgLowConf * 100) / 100,
        affectedModels,
        totalCitations,
        percentageOfTotal: totalCitations > 0 ? `${Math.round(lowConfidenceCitations.length / totalCitations * 100)}%` : 'N/A',
      }),
      expectedBehavior: 'Low-confidence citations should be flagged and downweighted in score calculations',
      actualBehavior: `${lowConfidenceCitations.length} low-confidence citations exist${totalCitations > 0 ? ` (${Math.round(lowConfidenceCitations.length / totalCitations * 100)}% of total)` : ''}`,
      userImpact: 'low',
      businessImpact: 'reputation',
      fixSuggestion: 'Add confidence threshold filter to citation aggregation queries. Flag low-confidence citations in the UI. Consider excluding confidence < 0.3 from scoring entirely.',
    })
  }

  // Issue: High false positive rate in signal detection
  const totalSignals = signals.length
  const lowSignificanceSignals = staleChanges.length // isSignal=true but significanceScore < 0.4
  if (totalSignals > 0 && lowSignificanceSignals > 0) {
    const falsePositiveRate = lowSignificanceSignals / totalSignals
    if (falsePositiveRate > 0.1) {
      issues.push({
        title: `Breaking signal detection has ${(falsePositiveRate * 100).toFixed(0)}% low-significance rate`,
        description: `Of ${totalSignals} flagged signals, ${lowSignificanceSignals} have significanceScore < 0.4 (${(falsePositiveRate * 100).toFixed(0)}%). These are likely false positives triggered by normal data fluctuations rather than genuine shifts, eroding user trust in alert reliability.`,
        page: '/observatory',
        element: 'BreakingSignal detection algorithm, ObservatoryChange.isSignal',
        severity: falsePositiveRate > 0.25 ? 'critical' : 'medium',
        evidence: JSON.stringify({
          totalSignals,
          lowSignificanceSignals,
          falsePositiveRate: `${(falsePositiveRate * 100).toFixed(1)}%`,
          threshold: '10%',
          sampleTypes: Array.from(new Set(staleChanges.map(c => c.changeType))),
        }),
        expectedBehavior: 'Low-significance signal rate should be under 10% to maintain alert credibility',
        actualBehavior: `${(falsePositiveRate * 100).toFixed(0)}% of signals have low significance scores`,
        userImpact: 'medium',
        businessImpact: 'retention',
        fixSuggestion: 'Raise the significance threshold for isSignal=true. Require confirmation from 2+ models. Add minimum data volume threshold. Implement exponential moving average to smooth noise.',
      })
    }
  }

  // Issue: No data at all
  if (!hasAnyData) {
    issues.push({
      title: 'No Observatory data found in database',
      description: 'The Observatory has zero reports, responses, changes, and citations. All scores are based on no data and should be considered invalid. The crawl pipeline may not be running or may have failed.',
      page: '/observatory',
      element: 'ObservatoryCrawl, data pipeline',
      severity: 'critical',
      evidence: JSON.stringify({ totalReports, totalResponses, totalChanges, totalCitations, activeModelCount }),
      expectedBehavior: 'The Observatory should have crawled data from active AI models',
      actualBehavior: 'Database is empty — no reports, responses, changes, or citations',
      userImpact: 'high',
      businessImpact: 'revenue',
      fixSuggestion: 'Verify crawl scheduler is running. Check ObservatoryCrawl for failed runs. Trigger a manual crawl to populate data.',
    })
  }

  // ── 4. Create QAIssue records ──────────────────────────────────
  if (currentRun) {
    for (const issue of issues) {
      await db.qAIssue.create({
        data: {
          runId,
          title: issue.title,
          description: issue.description,
          page: issue.page,
          element: issue.element,
          severity: issue.severity,
          category: 'observatory',
          reviewer: 'observatory_reviewer',
          evidence: issue.evidence,
          expectedBehavior: issue.expectedBehavior,
          actualBehavior: issue.actualBehavior,
          userImpact: issue.userImpact,
          businessImpact: issue.businessImpact,
          fixSuggestion: issue.fixSuggestion,
        },
      })
      issueCount++
    }
  }

  // ── 5. Compute details from real data ──────────────────────────
  const avgCitationConfidence = recentCitations.length > 0
    ? Math.round(recentCitations.reduce((s, c) => s + (c.confidence ?? 0), 0) / recentCitations.length * 100)
    : 0

  const avgReportEvidenceScore = reportScores.length > 0
    ? Math.round(reportScores.reduce((s, r) => s + r.evidenceScore, 0) / reportScores.length)
    : 0

  const avgReportConfidence = reportScores.length > 0
    ? Math.round(reportScores.reduce((s, r) => s + r.confidenceScore, 0) / reportScores.length)
    : 0

  const avgReportFreshness = reportScores.length > 0
    ? Math.round(reportScores.reduce((s, r) => s + r.freshnessScore, 0) / reportScores.length)
    : 0

  // False positive rate from signals
  const computedFalsePositiveRate = totalSignals > 0
    ? `${Math.round(lowSignificanceSignals / totalSignals * 100)}%`
    : '0%'

  // Data quality: blend of evidence score and recency
  const dataQualityScore = Math.round(
    (avgReportEvidenceScore * 0.4 + avgReportFreshness * 0.3 + avgCitationConfidence * 0.3)
  )

  // Check for stale sources (responses older than 90 days)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  const staleSourceCount = await db.observatoryResponse.count({
    where: { createdAt: { lt: ninetyDaysAgo } },
  })

  // ── 6. Build summary and recommendations ───────────────────────
  const summaryParts: string[] = []
  summaryParts.push(`Observatory research integrity review found ${issueCount} issue${issueCount !== 1 ? 's' : ''}.`)

  if (!hasAnyData) {
    summaryParts.push('No data found in the database — score is 0 and all findings are invalid until the crawl pipeline runs.')
  } else {
    summaryParts.push(`Score: ${score}/100 (data coverage: ${dataCoverageScore}/25, model coverage: ${modelCoverageScore}/25, recency: ${recencyScore}/25, evidence quality: ${evidenceQualityScore}/25).`)
    summaryParts.push(`Data volume: ${totalReports} reports, ${totalResponses} responses, ${totalCitations} citations, ${totalChanges} changes across ${activeModelCount} active AI models.`)
    if (staleModels.length > 0) {
      summaryParts.push(`${staleModels.length} model${staleModels.length > 1 ? 's' : ''} have stale crawl data (>7 days).`)
    }
    if (simulatedResponses.length > 0) {
      summaryParts.push(`${simulatedResponses.length} simulated responses detected.`)
    }
    if (staleSourceCount > 0) {
      summaryParts.push(`${staleSourceCount} responses older than 90 days may need recency downweighting.`)
    }
  }

  const summary = summaryParts.join(' ')

  const recommendations: string[] = []
  if (!hasAnyData) {
    recommendations.push('Trigger a crawl immediately — the Observatory has no data to review')
  }
  if (staleModels.length > 0) {
    recommendations.push(`Re-crawl stale models: ${staleModels.map(m => m.displayName).join(', ')}`)
  }
  if (simulatedResponses.length > 0) {
    recommendations.push('Purge simulated responses from production or add isSimulated=false filter to all queries')
  }
  if (lowDataCategories.length > 0) {
    recommendations.push(`Increase crawl coverage for sparse categories: ${lowDataCategories.map(([cat]) => cat).join(', ')}`)
  }
  if (lowConfidenceCitations.length > 0) {
    recommendations.push('Filter or flag citations with confidence < 0.5 in evidence calculations')
  }
  if (totalSignals > 0 && lowSignificanceSignals / totalSignals > 0.1) {
    recommendations.push('Raise signal significance threshold to reduce false positive rate below 10%')
  }
  if (staleSourceCount > 0) {
    recommendations.push(`Implement recency scoring: downweight ${staleSourceCount} responses older than 90 days`)
  }
  // Fallback recommendation if none triggered
  if (recommendations.length === 0 && hasAnyData) {
    recommendations.push('Continue regular crawl schedule to maintain data freshness')
    recommendations.push('Monitor confidence distribution for emerging low-confidence patterns')
  }

  // ── 7. Assemble result ─────────────────────────────────────────
  const result: ReviewerResult = {
    reviewer: 'observatory_reviewer',
    score,
    issues: issueCount,
    summary,
    recommendations,
    details: {
      // Score breakdown
      scoreBreakdown: {
        dataCoverage: dataCoverageScore,
        modelCoverage: modelCoverageScore,
        recency: recencyScore,
        evidenceQuality: evidenceQualityScore,
      },
      // Data volume
      totalReports,
      totalResponses,
      totalChanges,
      totalCitations,
      // Model coverage
      modelCoverage: activeModelCount,
      documentedModelCoverage: activeModelCount,
      totalModelsInRegistry: totalModelCount,
      // Quality metrics from real data
      dataQualityScore,
      citationAccuracy: avgCitationConfidence,
      avgReportEvidenceScore,
      avgReportConfidence,
      avgReportFreshness,
      // Signal detection
      totalSignals,
      lowSignificanceSignals,
      falsePositiveRate: computedFalsePositiveRate,
      breakingAlertAccuracy: totalSignals > 0
        ? `${Math.round((1 - lowSignificanceSignals / totalSignals) * 100)}%`
        : 'N/A',
      // Stale data
      staleModelCount: staleModels.length,
      staleSourceCount,
      simulatedResponseCount: simulatedResponses.length,
      // Low data
      lowDataCategories: lowDataCategories.length,
      totalPromptCategories: categoryCounts.size,
      // Last activity
      lastResponseAt: latestResponse?.createdAt?.toISOString() ?? null,
      lastCrawlAt: latestCrawl?.startedAt?.toISOString() ?? null,
    },
  }

  console.log(`[QA:Observatory] Complete: score=${score}, issues=${issueCount}`)
  return result
}
