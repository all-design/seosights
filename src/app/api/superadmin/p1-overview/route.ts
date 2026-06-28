/**
 * P1 Modules Overview API
 * Aggregates real data from all P1 feature modules:
 * - AI Visibility Replay™
 * - AI Recommendation Recorder™
 * - Auto Execute™
 * - ROI Opportunity Queue™
 * - Email Digest
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeQuery } from '@/lib/safe-query'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // ── AI Visibility Replay™ ────────────────────────────────────
    const [
      totalReplaySessions,
      recentReplaySessions,
    ] = await Promise.all([
      safeQuery(() => db.replaySession.count(), 0),
      safeQuery(() => db.replaySession.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          domain: true,
          title: true,
          totalFrames: true,
          status: true,
          startDate: true,
          endDate: true,
          createdAt: true,
        },
      }), []),
    ])

    // Calculate avg score change from recent snapshots
    const recentSnapshots = await safeQuery(() => db.visibilitySnapshot.findMany({
      take: 100,
      orderBy: { capturedAt: 'desc' },
      select: { overallScore: true, domain: true },
    }), [])

    let avgScoreChange = 0
    if (recentSnapshots.length >= 2) {
      const domainScores = new Map<string, number[]>()
      for (const snap of recentSnapshots) {
        if (!domainScores.has(snap.domain)) domainScores.set(snap.domain, [])
        domainScores.get(snap.domain)!.push(snap.overallScore)
      }
      const changes: number[] = []
      for (const scores of domainScores.values()) {
        if (scores.length >= 2) {
          changes.push(scores[0] - scores[scores.length - 1])
        }
      }
      if (changes.length > 0) {
        avgScoreChange = Math.round((changes.reduce((a, b) => a + b, 0) / changes.length) * 10) / 10
      }
    }

    // ── AI Recommendation Recorder™ ──────────────────────────────
    const [
      totalSnapshots,
      totalDiffs,
      criticalChanges,
      recentDiffs,
    ] = await Promise.all([
      safeQuery(() => db.recommendationSnapshot.count(), 0),
      safeQuery(() => db.recommendationDiff.count(), 0),
      safeQuery(() => db.recommendationDiff.count({ where: { severity: 'critical' } }), 0),
      safeQuery(() => db.recommendationDiff.findMany({
        take: 5,
        orderBy: { capturedAt: 'desc' },
        select: {
          id: true,
          domain: true,
          prompt: true,
          severity: true,
          summary: true,
          capturedAt: true,
        },
      }), []),
    ])

    // ── Auto Execute™ ────────────────────────────────────────────
    const [
      totalExecutions,
      successCount,
      pendingExecCount,
      recentExecutions,
    ] = await Promise.all([
      safeQuery(() => db.autoExecution.count(), 0),
      safeQuery(() => db.autoExecution.count({ where: { status: 'success' } }), 0),
      safeQuery(() => db.autoExecution.count({ where: { status: 'pending' } }), 0),
      safeQuery(() => db.autoExecution.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          domain: true,
          platform: true,
          actionType: true,
          status: true,
          createdAt: true,
        },
      }), []),
    ])

    const successRate = totalExecutions > 0
      ? Math.round((successCount / totalExecutions) * 1000) / 10
      : 0

    // ── ROI Opportunity Queue™ ───────────────────────────────────
    const [
      totalQueueItems,
      pendingQueueItems,
      topQueueItems,
    ] = await Promise.all([
      safeQuery(() => db.actionItem.count(), 0),
      safeQuery(() => db.actionItem.count({ where: { status: { in: ['pending', 'queued'] } } }), 0),
      safeQuery(() => db.actionItem.findMany({
        take: 5,
        orderBy: { roiScore: 'desc' },
        where: { status: { in: ['pending', 'queued'] } },
        select: {
          id: true,
          domain: true,
          actionType: true,
          title: true,
          priority: true,
          roiScore: true,
          estimatedScoreGain: true,
          status: true,
          createdAt: true,
        },
      }), []),
    ])

    const totalEstimatedGainResult = await safeQuery(() => db.actionItem.aggregate({
      _sum: { estimatedScoreGain: true },
      where: { status: { in: ['pending', 'queued'] } },
    }), { _sum: { estimatedScoreGain: 0 } })
    const totalEstimatedGain = totalEstimatedGainResult._sum.estimatedScoreGain || 0

    // ── Email Digest ─────────────────────────────────────────────
    const [
      totalDigestsSent,
      pendingDigests,
      recentDigests,
    ] = await Promise.all([
      safeQuery(() => db.emailDigest.count({ where: { status: 'sent' } }), 0),
      safeQuery(() => db.emailDigest.count({ where: { status: 'pending' } }), 0),
      safeQuery(() => db.emailDigest.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          domain: true,
          digestType: true,
          scoreDelta: true,
          subject: true,
          status: true,
          createdAt: true,
        },
      }), []),
    ])

    // Calculate avg score delta
    const avgDeltaResult = await safeQuery(() => db.emailDigest.aggregate({
      _avg: { scoreDelta: true },
      where: { status: 'sent' },
    }), { _avg: { scoreDelta: null } })
    const avgScoreDelta = avgDeltaResult._avg.scoreDelta
      ? Math.round(avgDeltaResult._avg.scoreDelta * 10) / 10
      : 0

    // ── Build response ───────────────────────────────────────────
    return NextResponse.json({
      modules: [
        {
          key: 'replay',
          label: 'AI Visibility Replay™',
          icon: 'eye',
          metrics: [
            { label: 'Total Sessions', value: totalReplaySessions, trend: 0 },
            { label: 'Avg Score Change', value: avgScoreChange > 0 ? `+${avgScoreChange}` : `${avgScoreChange}`, trend: 0 },
            { label: 'Total Frames', value: recentReplaySessions.reduce((sum, s) => sum + s.totalFrames, 0), trend: 0 },
          ],
          recentItems: recentReplaySessions.map((s) => ({
            id: s.id,
            label: s.domain,
            detail: s.title,
            timestamp: s.createdAt.toISOString(),
            status: s.status === 'completed' ? 'success' : s.status === 'ready' ? 'pending' : 'info',
          })),
        },
        {
          key: 'recorder',
          label: 'AI Recommendation Recorder™',
          icon: 'camera',
          metrics: [
            { label: 'Total Snapshots', value: totalSnapshots, trend: 0 },
            { label: 'Total Diffs', value: totalDiffs, trend: 0 },
            { label: 'Critical Changes', value: criticalChanges, trend: 0 },
          ],
          recentItems: recentDiffs.map((d) => ({
            id: d.id,
            label: d.domain,
            detail: d.summary || `Prompt: ${d.prompt.substring(0, 50)}`,
            timestamp: d.capturedAt.toISOString(),
            status: d.severity === 'critical' ? 'critical' : d.severity === 'positive' ? 'success' : 'info',
          })),
        },
        {
          key: 'autoExecute',
          label: 'Auto Execute™',
          icon: 'wrench',
          metrics: [
            { label: 'Total Executions', value: totalExecutions, trend: 0 },
            { label: 'Success Rate', value: `${successRate}%`, trend: 0 },
            { label: 'Pending', value: pendingExecCount, trend: 0 },
          ],
          recentItems: recentExecutions.map((e) => ({
            id: e.id,
            label: `${e.actionType} on ${e.platform}`,
            detail: e.domain,
            timestamp: e.createdAt.toISOString(),
            status: e.status === 'success' ? 'success' : e.status === 'failed' ? 'critical' : e.status === 'pending' ? 'pending' : 'info',
          })),
        },
        {
          key: 'roiQueue',
          label: 'ROI Opportunity Queue™',
          icon: 'target',
          metrics: [
            { label: 'Total Items', value: totalQueueItems, trend: 0 },
            { label: 'Pending Items', value: pendingQueueItems, trend: 0 },
            { label: 'Est. Score Gain', value: totalEstimatedGain, trend: 0 },
          ],
          recentItems: topQueueItems.map((q) => ({
            id: q.id,
            label: q.title,
            detail: `${q.domain} · ROI: ${q.roiScore} · +${q.estimatedScoreGain}pts`,
            timestamp: q.createdAt.toISOString(),
            status: q.priority === 'critical' ? 'critical' : q.priority === 'high' ? 'warning' : 'pending',
          })),
        },
        {
          key: 'digest',
          label: 'Email Digest',
          icon: 'mail',
          metrics: [
            { label: 'Total Sent', value: totalDigestsSent, trend: 0 },
            { label: 'Pending', value: pendingDigests, trend: 0 },
            { label: 'Avg Score Delta', value: avgScoreDelta > 0 ? `+${avgScoreDelta}` : `${avgScoreDelta}`, trend: 0 },
          ],
          recentItems: recentDigests.map((d) => ({
            id: d.id,
            label: `${d.domain} ${d.digestType}`,
            detail: `Score change: ${d.scoreDelta > 0 ? '+' : ''}${d.scoreDelta}`,
            timestamp: d.createdAt.toISOString(),
            status: d.status === 'sent' ? 'success' : d.status === 'failed' ? 'critical' : 'pending',
          })),
        },
      ],
    })
  } catch (error) {
    console.error('[p1-overview] GET error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to fetch P1 overview' },
      { status: 500 }
    )
  }
}
