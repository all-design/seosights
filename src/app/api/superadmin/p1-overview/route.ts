/**
 * P1 Modules Overview API
 * Aggregates real data from all P1 feature modules.
 *
 * ENHANCED: Returns status + confidence per module. No silent fallbacks.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeQuery, type DataStatus } from '@/lib/safe-query'
import { logFallback } from '@/lib/fallback-logger'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const api = '/api/superadmin/p1-overview'
  const correlationId = request.headers.get('x-request-id') || undefined
  const fallbacksUsed: string[] = []

  try {
    // ── AI Visibility Replay™ ────────────────────────────────────
    const [
      totalReplaySessionsResult,
      recentReplaySessionsResult,
    ] = await Promise.all([
      safeQuery(() => db.replaySession.count(), 0, { api, correlationId }),
      safeQuery(() => db.replaySession.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, domain: true, title: true, totalFrames: true, status: true,
          startDate: true, endDate: true, createdAt: true,
        },
      }), [] as { id: string; domain: string; title: string; totalFrames: number; status: string; startDate: Date; endDate: Date; createdAt: Date }[], { api, correlationId }),
    ])

    if (totalReplaySessionsResult.status === 'fallback') fallbacksUsed.push('replay_count')
    if (recentReplaySessionsResult.status === 'fallback') fallbacksUsed.push('replay_recent')

    const recentSnapshotsResult = await safeQuery(() => db.visibilitySnapshot.findMany({
      take: 100,
      orderBy: { capturedAt: 'desc' },
      select: { overallScore: true, domain: true },
    }), [] as { overallScore: number; domain: string }[], { api, correlationId })

    if (recentSnapshotsResult.status === 'fallback') fallbacksUsed.push('snapshots')

    let avgScoreChange = 0
    if (recentSnapshotsResult.data.length >= 2) {
      const domainScores = new Map<string, number[]>()
      for (const snap of recentSnapshotsResult.data) {
        if (!domainScores.has(snap.domain)) domainScores.set(snap.domain, [])
        domainScores.get(snap.domain)!.push(snap.overallScore)
      }
      const changes: number[] = []
      for (const scores of domainScores.values()) {
        if (scores.length >= 2) changes.push(scores[0] - scores[scores.length - 1])
      }
      if (changes.length > 0) avgScoreChange = Math.round((changes.reduce((a, b) => a + b, 0) / changes.length) * 10) / 10
    }

    // ── AI Recommendation Recorder™ ──────────────────────────────
    const [
      totalSnapshotsResult,
      totalDiffsResult,
      criticalChangesResult,
      recentDiffsResult,
    ] = await Promise.all([
      safeQuery(() => db.recommendationSnapshot.count(), 0, { api, correlationId }),
      safeQuery(() => db.recommendationDiff.count(), 0, { api, correlationId }),
      safeQuery(() => db.recommendationDiff.count({ where: { severity: 'critical' } }), 0, { api, correlationId }),
      safeQuery(() => db.recommendationDiff.findMany({
        take: 5,
        orderBy: { capturedAt: 'desc' },
        select: { id: true, domain: true, prompt: true, severity: true, summary: true, capturedAt: true },
      }), [] as { id: string; domain: string; prompt: string; severity: string; summary: string; capturedAt: Date }[], { api, correlationId }),
    ])

    if (totalSnapshotsResult.status === 'fallback') fallbacksUsed.push('recorder_snapshots')
    if (totalDiffsResult.status === 'fallback') fallbacksUsed.push('recorder_diffs')

    // ── Auto Execute™ ────────────────────────────────────────────
    const [
      totalExecutionsResult,
      successCountResult,
      pendingExecCountResult,
      recentExecutionsResult,
    ] = await Promise.all([
      safeQuery(() => db.autoExecution.count(), 0, { api, correlationId }),
      safeQuery(() => db.autoExecution.count({ where: { status: 'success' } }), 0, { api, correlationId }),
      safeQuery(() => db.autoExecution.count({ where: { status: 'pending' } }), 0, { api, correlationId }),
      safeQuery(() => db.autoExecution.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, domain: true, platform: true, actionType: true, status: true, createdAt: true },
      }), [] as { id: string; domain: string; platform: string; actionType: string; status: string; createdAt: Date }[], { api, correlationId }),
    ])

    if (totalExecutionsResult.status === 'fallback') fallbacksUsed.push('autoexec_total')

    const successRate = totalExecutionsResult.data > 0
      ? Math.round((successCountResult.data / totalExecutionsResult.data) * 1000) / 10
      : 0

    // ── ROI Opportunity Queue™ ───────────────────────────────────
    const [
      totalQueueItemsResult,
      pendingQueueItemsResult,
      topQueueItemsResult,
    ] = await Promise.all([
      safeQuery(() => db.actionItem.count(), 0, { api, correlationId }),
      safeQuery(() => db.actionItem.count({ where: { status: { in: ['pending', 'queued'] } } }), 0, { api, correlationId }),
      safeQuery(() => db.actionItem.findMany({
        take: 5,
        orderBy: { roiScore: 'desc' },
        where: { status: { in: ['pending', 'queued'] } },
        select: {
          id: true, domain: true, actionType: true, title: true, priority: true,
          roiScore: true, estimatedScoreGain: true, status: true, createdAt: true,
        },
      }), [] as { id: string; domain: string; actionType: string; title: string; priority: string; roiScore: number; estimatedScoreGain: number; status: string; createdAt: Date }[], { api, correlationId }),
    ])

    if (totalQueueItemsResult.status === 'fallback') fallbacksUsed.push('queue_total')

    const totalEstimatedGainResult = await safeQuery(() => db.actionItem.aggregate({
      _sum: { estimatedScoreGain: true },
      where: { status: { in: ['pending', 'queued'] } },
    }), { _sum: { estimatedScoreGain: 0 } }, { api })

    const totalEstimatedGain = totalEstimatedGainResult.data._sum.estimatedScoreGain || 0

    // ── Email Digest ─────────────────────────────────────────────
    const [
      totalDigestsSentResult,
      pendingDigestsResult,
      recentDigestsResult,
    ] = await Promise.all([
      safeQuery(() => db.emailDigest.count({ where: { status: 'sent' } }), 0, { api, correlationId }),
      safeQuery(() => db.emailDigest.count({ where: { status: 'pending' } }), 0, { api, correlationId }),
      safeQuery(() => db.emailDigest.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, domain: true, digestType: true, scoreDelta: true, subject: true, status: true, createdAt: true },
      }), [] as { id: string; domain: string; digestType: string; scoreDelta: number; subject: string; status: string; createdAt: Date }[], { api, correlationId }),
    ])

    const avgDeltaResult = await safeQuery(() => db.emailDigest.aggregate({
      _avg: { scoreDelta: true },
      where: { status: 'sent' },
    }), { _avg: { scoreDelta: null } }, { api })

    const avgScoreDelta = avgDeltaResult.data._avg.scoreDelta
      ? Math.round(avgDeltaResult.data._avg.scoreDelta * 10) / 10
      : 0

    // ── Determine overall status ──
    const overallStatus: DataStatus = fallbacksUsed.length === 0 ? 'live' : fallbacksUsed.length <= 3 ? 'estimated' : 'fallback'
    const overallConfidence = Math.max(0, 100 - fallbacksUsed.length * 10)

    if (fallbacksUsed.length > 0) {
      logFallback({
        api,
        reason: `${fallbacksUsed.length} fallback(s): ${fallbacksUsed.join(', ')}`,
        category: 'db_missing_table',
        confidence: overallConfidence,
        correlationId,
      })
    }

    // ── Build response ───────────────────────────────────────────
    return NextResponse.json({
      modules: [
        {
          key: 'replay',
          label: 'AI Visibility Replay™',
          icon: 'eye',
          metrics: [
            { label: 'Total Sessions', value: totalReplaySessionsResult.data, trend: 0 },
            { label: 'Avg Score Change', value: avgScoreChange > 0 ? `+${avgScoreChange}` : `${avgScoreChange}`, trend: 0 },
            { label: 'Total Frames', value: recentReplaySessionsResult.data.reduce((sum, s) => sum + s.totalFrames, 0), trend: 0 },
          ],
          recentItems: recentReplaySessionsResult.data.map((s) => ({
            id: s.id,
            label: s.domain,
            detail: s.title,
            timestamp: s.createdAt.toISOString(),
            status: s.status === 'completed' ? 'success' : s.status === 'ready' ? 'pending' : 'info',
          })),
          status: totalReplaySessionsResult.status,
          confidence: totalReplaySessionsResult.confidence,
        },
        {
          key: 'recorder',
          label: 'AI Recommendation Recorder™',
          icon: 'camera',
          metrics: [
            { label: 'Total Snapshots', value: totalSnapshotsResult.data, trend: 0 },
            { label: 'Total Diffs', value: totalDiffsResult.data, trend: 0 },
            { label: 'Critical Changes', value: criticalChangesResult.data, trend: 0 },
          ],
          recentItems: recentDiffsResult.data.map((d) => ({
            id: d.id,
            label: d.domain,
            detail: d.summary || `Prompt: ${d.prompt.substring(0, 50)}`,
            timestamp: d.capturedAt.toISOString(),
            status: d.severity === 'critical' ? 'critical' : d.severity === 'positive' ? 'success' : 'info',
          })),
          status: totalSnapshotsResult.status,
          confidence: totalSnapshotsResult.confidence,
        },
        {
          key: 'autoExecute',
          label: 'Auto Execute™',
          icon: 'wrench',
          metrics: [
            { label: 'Total Executions', value: totalExecutionsResult.data, trend: 0 },
            { label: 'Success Rate', value: `${successRate}%`, trend: 0 },
            { label: 'Pending', value: pendingExecCountResult.data, trend: 0 },
          ],
          recentItems: recentExecutionsResult.data.map((e) => ({
            id: e.id,
            label: `${e.actionType} on ${e.platform}`,
            detail: e.domain,
            timestamp: e.createdAt.toISOString(),
            status: e.status === 'success' ? 'success' : e.status === 'failed' ? 'critical' : e.status === 'pending' ? 'pending' : 'info',
          })),
          status: totalExecutionsResult.status,
          confidence: totalExecutionsResult.confidence,
        },
        {
          key: 'roiQueue',
          label: 'ROI Opportunity Queue™',
          icon: 'target',
          metrics: [
            { label: 'Total Items', value: totalQueueItemsResult.data, trend: 0 },
            { label: 'Pending Items', value: pendingQueueItemsResult.data, trend: 0 },
            { label: 'Est. Score Gain', value: totalEstimatedGain, trend: 0 },
          ],
          recentItems: topQueueItemsResult.data.map((q) => ({
            id: q.id,
            label: q.title,
            detail: `${q.domain} · ROI: ${q.roiScore} · +${q.estimatedScoreGain}pts`,
            timestamp: q.createdAt.toISOString(),
            status: q.priority === 'critical' ? 'critical' : q.priority === 'high' ? 'warning' : 'pending',
          })),
          status: totalQueueItemsResult.status,
          confidence: totalQueueItemsResult.confidence,
        },
        {
          key: 'digest',
          label: 'Email Digest',
          icon: 'mail',
          metrics: [
            { label: 'Total Sent', value: totalDigestsSentResult.data, trend: 0 },
            { label: 'Pending', value: pendingDigestsResult.data, trend: 0 },
            { label: 'Avg Score Delta', value: avgScoreDelta > 0 ? `+${avgScoreDelta}` : `${avgScoreDelta}`, trend: 0 },
          ],
          recentItems: recentDigestsResult.data.map((d) => ({
            id: d.id,
            label: `${d.domain} ${d.digestType}`,
            detail: `Score change: ${d.scoreDelta > 0 ? '+' : ''}${d.scoreDelta}`,
            timestamp: d.createdAt.toISOString(),
            status: d.status === 'sent' ? 'success' : d.status === 'failed' ? 'critical' : 'pending',
          })),
          status: totalDigestsSentResult.status,
          confidence: totalDigestsSentResult.confidence,
        },
      ],
      status: overallStatus,
      confidence: overallConfidence,
      fallbacksUsed,
    })
  } catch (error) {
    console.error('[p1-overview] GET error:', error instanceof Error ? error.message : 'Unknown')

    logFallback({
      api,
      reason: `Top-level error: ${error instanceof Error ? error.message.substring(0, 200) : 'Unknown'}`,
      category: 'unknown',
      confidence: 0,
      correlationId,
      error,
    })

    // Return fallback data WITH status indicator (never silent)
    return NextResponse.json({
      modules: [
        { key: 'replay', label: 'AI Visibility Replay™', icon: 'eye', metrics: [{ label: 'Total Sessions', value: 0, trend: 0 }, { label: 'Avg Score Change', value: '0', trend: 0 }, { label: 'Total Frames', value: 0, trend: 0 }], recentItems: [], status: 'fallback', confidence: 0 },
        { key: 'recorder', label: 'AI Recommendation Recorder™', icon: 'camera', metrics: [{ label: 'Total Snapshots', value: 0, trend: 0 }, { label: 'Total Diffs', value: 0, trend: 0 }, { label: 'Critical Changes', value: 0, trend: 0 }], recentItems: [], status: 'fallback', confidence: 0 },
        { key: 'autoExecute', label: 'Auto Execute™', icon: 'wrench', metrics: [{ label: 'Total Executions', value: 0, trend: 0 }, { label: 'Success Rate', value: '0%', trend: 0 }, { label: 'Pending', value: 0, trend: 0 }], recentItems: [], status: 'fallback', confidence: 0 },
        { key: 'roiQueue', label: 'ROI Opportunity Queue™', icon: 'target', metrics: [{ label: 'Total Items', value: 0, trend: 0 }, { label: 'Pending Items', value: 0, trend: 0 }, { label: 'Est. Score Gain', value: 0, trend: 0 }], recentItems: [], status: 'fallback', confidence: 0 },
        { key: 'digest', label: 'Email Digest', icon: 'mail', metrics: [{ label: 'Total Sent', value: 0, trend: 0 }, { label: 'Pending', value: 0, trend: 0 }, { label: 'Avg Score Delta', value: '0', trend: 0 }], recentItems: [], status: 'fallback', confidence: 0 },
      ],
      status: 'fallback' as DataStatus,
      confidence: 0,
      fallbacksUsed: ['top_level_error'],
    })
  }
}
