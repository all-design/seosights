import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/observatory/weather
 * AI Search Weather™ — daily weather data for AI search stability.
 * PUBLIC read-only API.
 *
 * Query params:
 *   days - Number of days of history (default 7, max 90)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Math.min(90, Math.max(1, Number(searchParams.get('days')) || 7))

    const now = new Date()
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    // Normalize to date-only (midnight UTC)
    const todayStart = new Date(now)
    todayStart.setUTCHours(0, 0, 0, 0)

    // ─── Fetch weather data ────────────────────────────────────────
    const weatherData = await db.observatoryWeatherDaily.findMany({
      where: {
        date: { gte: startDate },
      },
      orderBy: { date: 'desc' },
    })

    // ─── If no data, compute on-the-fly from changes ──────────────
    if (weatherData.length === 0) {
      return NextResponse.json({
        today: computeTodayFromChanges(),
        history: [],
        _meta: {
          computed: true,
          note: 'No ObservatoryWeatherDaily records found. Showing estimated values from change counts.',
        },
      })
    }

    // ─── Today's weather ──────────────────────────────────────────
    const todayOverall = weatherData.find(
      (w) => w.aiModel === 'overall' && w.date.toDateString() === todayStart.toDateString()
    )

    const todayModelWeather = weatherData.filter(
      (w) => w.aiModel !== 'overall' && w.date.toDateString() === todayStart.toDateString()
    )

    // If no "today" entry, use the most recent overall
    const overallWeather = todayOverall || weatherData.find((w) => w.aiModel === 'overall')

    const today = {
      overall: overallWeather
        ? {
            stabilityIndex: Math.round(overallWeather.stabilityIndex * 10) / 10,
            trend: overallWeather.trend,
            volatility: Math.round(overallWeather.volatility * 10) / 10,
          }
        : {
            stabilityIndex: 50,
            trend: 'stable',
            volatility: 50,
          },
      models: todayModelWeather.map((m) => ({
        aiModel: m.aiModel,
        stabilityIndex: Math.round(m.stabilityIndex * 10) / 10,
        volatility: Math.round(m.volatility * 10) / 10,
        trend: m.trend,
        changesCount: m.changesCount,
      })),
    }

    // ─── History ──────────────────────────────────────────────────
    const historyDates = [
      ...new Set(weatherData.map((w) => w.date.toISOString().split('T')[0])),
    ].sort()
      .reverse()
      .slice(0, days)

    const history = historyDates.map((dateStr) => {
      const dayData = weatherData.filter(
        (w) => w.date.toISOString().split('T')[0] === dateStr
      )

      const overallDay = dayData.find((d) => d.aiModel === 'overall')
      const modelDays = dayData.filter((d) => d.aiModel !== 'overall')

      return {
        date: dateStr,
        overall: overallDay
          ? {
              stabilityIndex: Math.round(overallDay.stabilityIndex * 10) / 10,
              trend: overallDay.trend,
            }
          : {
              stabilityIndex: 50,
              trend: 'stable',
            },
        models: Object.fromEntries(
          modelDays.map((m) => [
            m.aiModel,
            {
              stabilityIndex: Math.round(m.stabilityIndex * 10) / 10,
              trend: m.trend,
            },
          ])
        ),
      }
    })

    return NextResponse.json({
      today,
      history,
      _meta: {
        computed: false,
        daysRequested: days,
        dataPoints: weatherData.length,
      },
    })
  } catch (error) {
    console.error('[observatory/weather] GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch weather data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ─── Fallback computation when no weather data exists ─────────────

async function computeTodayFromChanges() {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const changes24h = await db.observatoryChange.count({
      where: { createdAt: { gte: last24h } },
    })

    // Simple heuristic: fewer changes = higher stability
    const stabilityIndex = Math.max(0, Math.min(100, 100 - changes24h * 2))
    const volatility = 100 - stabilityIndex
    const trend =
      stabilityIndex > 70 ? 'stable' : stabilityIndex > 40 ? 'low_volatility' : stabilityIndex > 20 ? 'high_volatility' : 'recovering'

    return {
      overall: { stabilityIndex, trend, volatility },
      models: [],
    }
  } catch {
    return {
      overall: { stabilityIndex: 50, trend: 'stable', volatility: 50 },
      models: [],
    }
  }
}
