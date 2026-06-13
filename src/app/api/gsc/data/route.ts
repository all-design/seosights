import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')
    const period = searchParams.get('period') || '28d'

    if (!domain) {
      return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 })
    }

    const validPeriods = ['7d', '28d', '90d']
    if (!validPeriods.includes(period)) {
      return NextResponse.json({ error: 'Period must be 7d, 28d, or 90d' }, { status: 400 })
    }

    const daysMap: Record<string, number> = { '7d': 7, '28d': 28, '90d': 90 }
    const days = daysMap[period]

    // Mock comparison data
    const totalImpressions = Math.round(45000 * (days / 28) + Math.random() * 5000)
    const totalClicks = Math.round(3200 * (days / 28) + Math.random() * 300)
    const aiMentions = Math.round(totalImpressions * 0.023 + Math.random() * 50)
    const avgCtr = ((totalClicks / totalImpressions) * 100).toFixed(2)
    const avgPosition = (3.2 + Math.random() * 1.5).toFixed(1)

    const mockData = {
      domain,
      period,
      days,
      generatedAt: new Date().toISOString(),
      summary: {
        googleImpressions: totalImpressions,
        googleClicks: totalClicks,
        googleCtr: parseFloat(avgCtr),
        googleAvgPosition: parseFloat(avgPosition),
        aiMentions,
        aiCitationRate: ((aiMentions / totalImpressions) * 100).toFixed(2),
      },
      comparison: {
        googleVsAi: `Your site gets ${totalImpressions.toLocaleString()} impressions from Google but ${aiMentions} mentions from AI engines`,
        correlation: 'Pages ranking #1-3 are 3X more likely to be cited by AI',
        insight: `For every ${Math.round(totalImpressions / aiMentions)} Google impressions, you get 1 AI citation. Top-ranking pages see a 3.2x boost in AI visibility.`,
      },
      correlationAnalysis: {
        position1to3: {
          googleImpressions: Math.round(totalImpressions * 0.45),
          aiCitationRate: 12.4,
          aiLikelihood: '3X more likely to be cited by AI',
        },
        position4to10: {
          googleImpressions: Math.round(totalImpressions * 0.35),
          aiCitationRate: 4.1,
          aiLikelihood: '1.2X more likely to be cited by AI',
        },
        position11plus: {
          googleImpressions: Math.round(totalImpressions * 0.2),
          aiCitationRate: 0.8,
          aiLikelihood: 'Rarely cited by AI engines',
        },
      },
      aiVsGoogleCards: [
        {
          title: 'Google Impressions',
          value: totalImpressions.toLocaleString(),
          change: '+12.3%',
          changeDirection: 'up' as const,
          description: `Over the last ${days} days`,
          color: '#10b981',
        },
        {
          title: 'AI Mentions',
          value: aiMentions.toLocaleString(),
          change: '+28.7%',
          changeDirection: 'up' as const,
          description: `Cited across ChatGPT, Claude, Perplexity, Gemini`,
          color: '#06b6d4',
        },
        {
          title: 'AI Citation Rate',
          value: `${((aiMentions / totalImpressions) * 100).toFixed(2)}%`,
          change: '+0.8%',
          changeDirection: 'up' as const,
          description: 'AI mentions per Google impression',
          color: '#f59e0b',
        },
        {
          title: 'Rank-AI Correlation',
          value: '3.2X',
          change: 'Strong',
          changeDirection: 'up' as const,
          description: 'Top 3 rankings = 3.2x AI citation boost',
          color: '#8b5cf6',
        },
      ],
      performanceChart: Array.from({ length: days }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (days - 1 - i))
        return {
          date: date.toISOString().split('T')[0],
          impressions: Math.round((totalImpressions / days) * (0.8 + Math.random() * 0.4)),
          clicks: Math.round((totalClicks / days) * (0.8 + Math.random() * 0.4)),
          aiMentions: Math.round((aiMentions / days) * (0.6 + Math.random() * 0.8)),
        }
      }),
      topCorrelatedPages: [
        { url: `https://${domain}/`, googlePosition: 2.1, aiCited: true, aiEngines: ['ChatGPT', 'Perplexity', 'Gemini'], correlation: 'strong' },
        { url: `https://${domain}/pricing`, googlePosition: 3.4, aiCited: true, aiEngines: ['ChatGPT', 'Claude'], correlation: 'strong' },
        { url: `https://${domain}/features`, googlePosition: 4.2, aiCited: true, aiEngines: ['Perplexity'], correlation: 'moderate' },
        { url: `https://${domain}/blog`, googlePosition: 8.5, aiCited: false, aiEngines: [], correlation: 'weak' },
        { url: `https://${domain}/docs`, googlePosition: 6.1, aiCited: false, aiEngines: [], correlation: 'weak' },
      ],
    }

    return NextResponse.json(mockData)
  } catch (error) {
    console.error('GSC data fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch GSC comparison data' }, { status: 500 })
  }
}
