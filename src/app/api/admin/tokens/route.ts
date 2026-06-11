import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const AGENT_IDS = [
  { agentId: 'master-director', agentName: 'Master Director' },
  { agentId: 'keyword-researcher', agentName: 'Keyword Researcher' },
  { agentId: 'competitor-analyst', agentName: 'Competitor Analyst' },
  { agentId: 'content-architect', agentName: 'Content Architect' },
  { agentId: 'on-page-auditor', agentName: 'On-Page Auditor' },
  { agentId: 'link-strategist', agentName: 'Link Strategist' },
  { agentId: 'tech-schema-auditor', agentName: 'Tech & Schema Auditor' },
  { agentId: 'backlink-prospector', agentName: 'Backlink Prospector' },
]

function generateMockData(days: number) {
  const agentStats = AGENT_IDS.map((a) => {
    const inputTokens = Math.floor(Math.random() * 80000) + 20000
    const outputTokens = Math.floor(Math.random() * 40000) + 10000
    const apiCalls = Math.floor(Math.random() * 50) + 10
    const failures = Math.floor(Math.random() * 3)
    return {
      agentId: a.agentId,
      agentName: a.agentName,
      totalInputTokens: inputTokens,
      totalOutputTokens: outputTokens,
      totalTokens: inputTokens + outputTokens,
      totalCost: Math.round((inputTokens * 0.00003 + outputTokens * 0.00006) * 100) / 100,
      totalApiCalls: apiCalls,
      totalFailures: failures,
      model: 'default',
    }
  })

  const costPerDay = []
  const now = new Date()
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(now)
    date.setDate(date.getDate() - d)
    costPerDay.push({
      date: date.toISOString().split('T')[0],
      cost: Math.round((Math.random() * 0.8 + 0.3) * 100) / 100,
    })
  }

  const totalCost = agentStats.reduce((sum, a) => sum + a.totalCost, 0)
  const totalApiCalls = agentStats.reduce((sum, a) => sum + a.totalApiCalls, 0)
  const totalFailures = agentStats.reduce((sum, a) => sum + a.totalFailures, 0)
  const completedAnalyses = Math.floor(Math.random() * 15) + 5

  return {
    summary: {
      totalCost: Math.round(totalCost * 100) / 100,
      totalTokens: agentStats.reduce((sum, a) => sum + a.totalTokens, 0),
      totalApiCalls,
      totalFailures,
      overallFailureRate: totalApiCalls > 0
        ? Math.round((totalFailures / totalApiCalls) * 10000) / 100
        : 0,
      completedAnalyses,
      costPerAudit: Math.round((totalCost / completedAnalyses) * 100) / 100,
    },
    agentStats,
    costPerDay,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const useMock = searchParams.get('mock') === 'true'

    // Fetch all token usage records within the time range
    const since = new Date()
    since.setDate(since.getDate() - days)

    const tokenUsages = await db.tokenUsage.findMany({
      where: {
        date: {
          gte: since,
        },
      },
      orderBy: { date: 'desc' },
    })

    // If no real data and not explicitly requesting mock, return mock data
    if (tokenUsages.length === 0 || useMock) {
      const mock = generateMockData(days)
      return NextResponse.json({ ...mock, isMock: tokenUsages.length === 0 })
    }

    // Group by agent
    const agentMap = new Map<string, {
      agentId: string
      agentName: string
      totalInputTokens: number
      totalOutputTokens: number
      totalTokens: number
      totalCost: number
      totalApiCalls: number
      totalFailures: number
      model: string
    }>()

    for (const tu of tokenUsages) {
      const key = tu.agentId
      if (!agentMap.has(key)) {
        agentMap.set(key, {
          agentId: tu.agentId,
          agentName: tu.agentName,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalTokens: 0,
          totalCost: 0,
          totalApiCalls: 0,
          totalFailures: 0,
          model: tu.model,
        })
      }
      const agg = agentMap.get(key)!
      agg.totalInputTokens += tu.totalInputTokens
      agg.totalOutputTokens += tu.totalOutputTokens
      agg.totalTokens += tu.totalTokens
      agg.totalCost += tu.estimatedCostUsd
      agg.totalApiCalls += tu.apiCalls
      agg.totalFailures += tu.failures
    }

    const agentStats = Array.from(agentMap.values())

    // Cost per day for chart
    const dailyCostMap = new Map<string, number>()
    for (const tu of tokenUsages) {
      const dayKey = tu.date.toISOString().split('T')[0]
      dailyCostMap.set(dayKey, (dailyCostMap.get(dayKey) || 0) + tu.estimatedCostUsd)
    }
    const costPerDay = Array.from(dailyCostMap.entries())
      .map(([date, cost]) => ({ date, cost: Math.round(cost * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Total analyses completed in the period
    const completedAnalyses = await db.analysis.count({
      where: {
        status: 'completed',
        createdAt: { gte: since },
      },
    })

    const totalCost = agentStats.reduce((sum, a) => sum + a.totalCost, 0)
    const costPerAudit = completedAnalyses > 0 ? totalCost / completedAnalyses : 0

    // Summary
    const summary = {
      totalCost: Math.round(totalCost * 100) / 100,
      totalTokens: agentStats.reduce((sum, a) => sum + a.totalTokens, 0),
      totalApiCalls: agentStats.reduce((sum, a) => sum + a.totalApiCalls, 0),
      totalFailures: agentStats.reduce((sum, a) => sum + a.totalFailures, 0),
      overallFailureRate: agentStats.reduce((sum, a) => sum + a.totalApiCalls, 0) > 0
        ? Math.round((agentStats.reduce((sum, a) => sum + a.totalFailures, 0) / agentStats.reduce((sum, a) => sum + a.totalApiCalls, 0)) * 10000) / 100
        : 0,
      completedAnalyses,
      costPerAudit: Math.round(costPerAudit * 100) / 100,
    }

    return NextResponse.json({
      summary,
      agentStats,
      costPerDay,
      isMock: false,
    })
  } catch (error) {
    console.error('[Admin Tokens API] Error:', error)
    // Return mock data on error so the UI still works
    const mock = generateMockData(30)
    return NextResponse.json({ ...mock, isMock: true })
  }
}
