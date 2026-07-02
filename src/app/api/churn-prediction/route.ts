import { NextRequest, NextResponse } from 'next/server'
import { safeQuery } from '@/lib/safe-query'

/**
 * Churn Prediction API
 * GET /api/churn-prediction — Get churn signals for users
 *
 * Risk criteria:
 * - >10 days since Mission Control → +0.2
 * - >7 days since last audit → +0.15
 * - >14 days since digest → +0.1
 * - 0 actions in 7 days → +0.25
 * - 0 actions in 30 days → +0.3
 * - Low activation score (<30) → +0.15
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const riskLevel = searchParams.get('risk') // low | medium | high | critical

  // Get churn signals from DB
  const signalsResult = await safeQuery(
    (db) => db.churnSignal.findMany({
      where: riskLevel ? { churnRisk: riskLevel } : {},
      orderBy: { churnScore: 'desc' },
      take: 50,
    }),
    [],
    { api: 'churn-prediction', confidence: 90 }
  )

  const hasLiveData = signalsResult.status === 'live' && signalsResult.data.length > 0

  // Estimated churn data when no live data
  const estimatedSignals = [
    {
      userId: 'demo-user-1',
      daysSinceLastAction: 14,
      daysSinceMissionCtrl: 12,
      daysSinceAudit: 18,
      daysSinceDigest: 20,
      totalActionsLast7d: 0,
      totalActionsLast30d: 2,
      churnRisk: 'high',
      churnScore: 0.78,
      activationScore: 35,
      plan: 'starter',
      suggestedAction: 'Send personalized re-engagement email with new AI Visibility insights',
    },
    {
      userId: 'demo-user-2',
      daysSinceLastAction: 5,
      daysSinceMissionCtrl: 3,
      daysSinceAudit: 5,
      daysSinceDigest: 7,
      totalActionsLast7d: 3,
      totalActionsLast30d: 12,
      churnRisk: 'low',
      churnScore: 0.12,
      activationScore: 80,
      plan: 'pro',
      suggestedAction: null,
    },
    {
      userId: 'demo-user-3',
      daysSinceLastAction: 8,
      daysSinceMissionCtrl: 10,
      daysSinceAudit: 9,
      daysSinceDigest: 8,
      totalActionsLast7d: 1,
      totalActionsLast30d: 4,
      churnRisk: 'medium',
      churnScore: 0.45,
      activationScore: 50,
      plan: 'starter',
      suggestedAction: 'Offer a free AI Visibility audit to re-engage',
    },
  ]

  // Aggregate stats
  const stats = {
    totalUsers: hasLiveData ? signalsResult.data.length : 3,
    byRisk: {
      low: hasLiveData ? signalsResult.data.filter(s => s.churnRisk === 'low').length : 1,
      medium: hasLiveData ? signalsResult.data.filter(s => s.churnRisk === 'medium').length : 1,
      high: hasLiveData ? signalsResult.data.filter(s => s.churnRisk === 'high').length : 1,
      critical: hasLiveData ? signalsResult.data.filter(s => s.churnRisk === 'critical').length : 0,
    },
    avgChurnScore: hasLiveData
      ? signalsResult.data.reduce((a, s) => a + s.churnScore, 0) / signalsResult.data.length
      : 0.45,
  }

  return NextResponse.json({
    status: hasLiveData ? 'live' : 'estimated',
    confidence: hasLiveData ? 90 : 40,
    data: {
      signals: hasLiveData ? signalsResult.data : estimatedSignals,
      stats,
      thresholds: {
        target: '< 5% monthly churn',
        alert: '> 8% monthly churn',
        incident: '> 12% monthly churn',
      },
      predictionFactors: {
        noMissionControl10d: '+0.2 risk',
        noAudit7d: '+0.15 risk',
        noDigest14d: '+0.1 risk',
        zeroActions7d: '+0.25 risk',
        zeroActions30d: '+0.3 risk',
        lowActivation: '+0.15 risk',
      },
      insight: 'Users with activation score >80 have 6x lower churn. Focus on activation first.',
    },
  })
}
