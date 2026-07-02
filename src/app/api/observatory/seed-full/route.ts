import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/observatory/seed-full
 * Comprehensive seed for ALL Observatory data.
 * Seeds: WeatherDaily, Industry, ChartData, BreakingResearch,
 *        ObservatoryResponse (isSimulated=true), CitationRecord, SourceTracking.
 */

const MODELS = ['chatgpt', 'claude', 'gemini', 'perplexity', 'grok', 'deepseek']
const CATEGORIES = ['brand_query', 'industry_query', 'competitive_query', 'factual_query', 'recommendation_query']
const DOMAINS = ['github.com', 'reddit.com', 'wikipedia.org', 'medium.com', 'stackoverflow.com', 'arxiv.org', 'nytimes.com', 'bbc.co.uk', 'reuters.com', 'techcrunch.com']

export async function POST() {
  try {
    const results: string[] = []
    const now = new Date()

    // ─── 1. Ensure AI Model Registry ───────────────────────────────
    const modelEntries = [
      { modelId: 'chatgpt', displayName: 'ChatGPT', provider: 'openai', version: 'GPT-4o' },
      { modelId: 'claude', displayName: 'Claude', provider: 'anthropic', version: 'Claude 3.5 Sonnet' },
      { modelId: 'gemini', displayName: 'Gemini', provider: 'google', version: 'Gemini 2.0' },
      { modelId: 'perplexity', displayName: 'Perplexity', provider: 'perplexity', version: 'Sonar Large' },
      { modelId: 'grok', displayName: 'Grok', provider: 'xai', version: 'Grok-2' },
      { modelId: 'deepseek', displayName: 'DeepSeek', provider: 'deepseek', version: 'DeepSeek-V3' },
    ]

    for (const model of modelEntries) {
      await db.aIModelRegistry.upsert({
        where: { modelId: model.modelId },
        update: { displayName: model.displayName, provider: model.provider, version: model.version, isActive: true },
        create: {
          modelId: model.modelId,
          displayName: model.displayName,
          provider: model.provider,
          version: model.version,
          capabilities: JSON.stringify({ web_access: true, citation: model.modelId !== 'deepseek', reasoning: true }),
          isActive: true,
          totalResponses: 0,
          knownChanges: 0,
        },
      })
    }
    results.push(`Ensured ${modelEntries.length} AI model registry entries`)

    // ─── 2. Create a daily crawl for each of last 30 days ──────────
    const crawls: Record<string, string> = {}
    for (let d = 29; d >= 0; d--) {
      const crawlDate = new Date(now.getTime() - d * 24 * 60 * 60 * 1000)
      const crawl = await db.observatoryCrawl.create({
        data: {
          type: 'daily',
          status: 'completed',
          modelsQueried: 6,
          promptsTotal: 30,
          promptsCompleted: 30,
          startedAt: crawlDate,
          completedAt: new Date(crawlDate.getTime() + 600000),
          durationMs: 600000,
        },
      })
      crawls[d] = crawl.id
    }
    results.push(`Created 30 daily crawls`)

    // ─── 3. Seed ObservatoryWeatherDaily (30 days × 7: 6 models + overall) ──
    let weatherCount = 0
    for (let d = 29; d >= 0; d--) {
      const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000)
      date.setUTCHours(0, 0, 0, 0)

      // Overall weather
      const overallStability = 65 + Math.sin(d * 0.3) * 15 + (Math.random() - 0.5) * 10
      const overallVolatility = 100 - overallStability
      const changesCount = Math.floor(Math.random() * 8) + 1

      await db.observatoryWeatherDaily.upsert({
        where: { date_aiModel: { date, aiModel: 'overall' } },
        update: {},
        create: {
          date,
          aiModel: 'overall',
          stabilityIndex: Math.max(0, Math.min(100, overallStability)),
          volatility: Math.max(0, Math.min(100, overallVolatility)),
          trend: overallStability > 70 ? 'stable' : overallStability > 50 ? 'low_volatility' : 'high_volatility',
          changesCount,
          citationShifts: Math.floor(changesCount * 0.5),
          sourceShifts: Math.floor(changesCount * 0.3),
          newCapabilities: Math.floor(changesCount * 0.2),
          avgSignificance: 0.3 + Math.random() * 0.5,
          previousStability: Math.max(0, Math.min(100, overallStability + (Math.random() - 0.5) * 10)),
        },
      })
      weatherCount++

      // Per-model weather
      for (const model of MODELS) {
        const modelStability = 55 + Math.sin(d * 0.25 + MODELS.indexOf(model)) * 20 + (Math.random() - 0.5) * 15
        const modelChanges = Math.floor(Math.random() * 5) + (d % 7 === 0 ? 3 : 0)

        await db.observatoryWeatherDaily.upsert({
          where: { date_aiModel: { date, aiModel: model } },
          update: {},
          create: {
            date,
            aiModel: model,
            stabilityIndex: Math.max(0, Math.min(100, modelStability)),
            volatility: Math.max(0, Math.min(100, 100 - modelStability)),
            trend: modelStability > 70 ? 'stable' : modelStability > 50 ? 'low_volatility' : modelStability > 30 ? 'high_volatility' : 'recovering',
            changesCount: modelChanges,
            citationShifts: Math.floor(modelChanges * 0.5),
            sourceShifts: Math.floor(modelChanges * 0.3),
            newCapabilities: Math.floor(modelChanges * 0.2),
            avgSignificance: 0.2 + Math.random() * 0.6,
            previousStability: Math.max(0, Math.min(100, modelStability + (Math.random() - 0.5) * 12)),
          },
        })
        weatherCount++
      }
    }
    results.push(`Seeded ${weatherCount} ObservatoryWeatherDaily records`)

    // ─── 4. Seed ObservatoryIndustry ──────────────────────────────
    const industryData = [
      { slug: 'healthcare', name: 'Healthcare', score: 72.5, trend: 'rising' },
      { slug: 'dentists', name: 'Dentists', score: 68.3, trend: 'stable' },
      { slug: 'legal', name: 'Legal Services', score: 65.1, trend: 'rising' },
      { slug: 'realestate', name: 'Real Estate', score: 58.7, trend: 'falling' },
      { slug: 'finance', name: 'Financial Services', score: 74.2, trend: 'stable' },
      { slug: 'ecommerce', name: 'E-Commerce', score: 69.8, trend: 'rising' },
      { slug: 'saas', name: 'SaaS / Software', score: 81.4, trend: 'rising' },
      { slug: 'education', name: 'Education', score: 62.9, trend: 'stable' },
      { slug: 'travel', name: 'Travel & Hospitality', score: 55.3, trend: 'falling' },
      { slug: 'restaurants', name: 'Restaurants & Food', score: 51.6, trend: 'falling' },
      { slug: 'construction', name: 'Construction', score: 47.8, trend: 'stable' },
      { slug: 'insurance', name: 'Insurance', score: 70.1, trend: 'rising' },
    ]

    let industryCount = 0
    for (const ind of industryData) {
      const previousScore = ind.score + (ind.trend === 'rising' ? -3.2 : ind.trend === 'falling' ? 2.8 : 0.5) + (Math.random() - 0.5) * 2
      await db.observatoryIndustry.upsert({
        where: { slug: ind.slug },
        update: {
          name: ind.name,
          indexScore: ind.score,
          previousScore: Math.round(previousScore * 10) / 10,
          trend: ind.trend,
          aiVisibilityAvg: ind.score * 0.9 + Math.random() * 5,
          dataPoints: 150 + Math.floor(Math.random() * 200),
          signalsCount: Math.floor(Math.random() * 12) + 2,
          lastUpdated: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000),
        },
        create: {
          slug: ind.slug,
          name: ind.name,
          description: `${ind.name} industry AI visibility index`,
          indexScore: ind.score,
          previousScore: Math.round(previousScore * 10) / 10,
          trend: ind.trend,
          aiVisibilityAvg: ind.score * 0.9 + Math.random() * 5,
          topModelsJson: JSON.stringify({
            chatgpt: { rank: 1, avgScore: ind.score + 5 },
            claude: { rank: 2, avgScore: ind.score - 2 },
            gemini: { rank: 3, avgScore: ind.score - 5 },
          }),
          dataPoints: 150 + Math.floor(Math.random() * 200),
          signalsCount: Math.floor(Math.random() * 12) + 2,
          lastUpdated: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000),
        },
      })
      industryCount++
    }
    results.push(`Seeded ${industryCount} ObservatoryIndustry records`)

    // ─── 5. Seed ObservatoryChartData ─────────────────────────────
    const chartsData = [
      {
        chartType: 'source_trend',
        chartKey: 'github-365d',
        title: 'GitHub Citation Trend — 365 Days',
        description: 'How often GitHub URLs are cited by AI models over the past year',
        dateRange: '365d',
        generateData: () => generateTrendData(365, 80, 140, 'github'),
      },
      {
        chartType: 'source_trend',
        chartKey: 'wikipedia-trend',
        title: 'Wikipedia Citation Trend — 90 Days',
        description: 'Wikipedia citation frequency across AI models',
        dateRange: '90d',
        generateData: () => generateTrendData(90, 60, 95, 'wikipedia'),
      },
      {
        chartType: 'source_trend',
        chartKey: 'reddit-decline',
        title: 'Reddit Citation Decline — 180 Days',
        description: 'Reddit citations have been declining across all major AI models',
        dateRange: '180d',
        generateData: () => generateTrendData(180, 120, 45, 'reddit'),
      },
      {
        chartType: 'model_citations',
        chartKey: 'chatgpt-top-sources',
        title: 'ChatGPT Top Cited Sources',
        description: 'Most frequently cited domains by ChatGPT in the last 30 days',
        dateRange: '30d',
        generateData: () => generateTopSourcesData('chatgpt'),
      },
      {
        chartType: 'model_citations',
        chartKey: 'claude-top-sources',
        title: 'Claude Top Cited Sources',
        description: 'Most frequently cited domains by Claude in the last 30 days',
        dateRange: '30d',
        generateData: () => generateTopSourcesData('claude'),
      },
      {
        chartType: 'industry_health',
        chartKey: 'overview-30d',
        title: 'Industry AI Visibility Health — 30 Days',
        description: 'Average AI visibility index score across all tracked industries',
        dateRange: '30d',
        generateData: () => generateIndustryHealthData(),
      },
      {
        chartType: 'citation_distribution',
        chartKey: 'all-models-30d',
        title: 'Citation Distribution by AI Model — 30 Days',
        description: 'How citations are distributed across different AI models',
        dateRange: '30d',
        generateData: () => generateCitationDistributionData(),
      },
      {
        chartType: 'weather_history',
        chartKey: 'overall-30d',
        title: 'AI Search Weather History — 30 Days',
        description: 'Overall AI search stability index over the last 30 days',
        dateRange: '30d',
        generateData: () => generateWeatherHistoryData(),
      },
    ]

    let chartsCount = 0
    for (const chart of chartsData) {
      const dataPoints = chart.generateData()
      const dataJson = JSON.stringify(dataPoints)

      await db.observatoryChartData.upsert({
        where: { chartType_chartKey: { chartType: chart.chartType, chartKey: chart.chartKey } },
        update: {
          title: chart.title,
          description: chart.description,
          dataJson,
          dateRange: chart.dateRange,
          dataPoints: Array.isArray(dataPoints) ? dataPoints.length : 0,
          lastUpdated: new Date(),
        },
        create: {
          chartType: chart.chartType,
          chartKey: chart.chartKey,
          title: chart.title,
          description: chart.description,
          dataJson,
          labelsJson: JSON.stringify({ xAxis: 'Date', yAxis: 'Count' }),
          dateRange: chart.dateRange,
          dataPoints: Array.isArray(dataPoints) ? dataPoints.length : 0,
          isPublic: true,
          embedCount: Math.floor(Math.random() * 50),
          lastUpdated: new Date(),
        },
      })
      chartsCount++
    }
    results.push(`Seeded ${chartsCount} ObservatoryChartData records`)

    // ─── 6. Seed ObservatoryResponse with isSimulated=true + CitationRecords ──
    const promptTemplates: Record<string, string[]> = {
      brand_query: [
        'What is {brand} and what does it do?',
        'Tell me about {brand}',
        'How reliable is {brand}?',
        'Is {brand} worth using in 2026?',
      ],
      industry_query: [
        'What are the top {industry} tools in 2026?',
        'Best {industry} software this year?',
        'How is AI changing {industry}?',
        'What should {industry} professionals know about AI search?',
      ],
      competitive_query: [
        'How does {brand} compare to {competitor}?',
        '{brand} vs {competitor} which is better?',
        'What is the best alternative to {competitor}?',
        'Which {industry} tool has the best AI features?',
      ],
      factual_query: [
        'How do AI search engines choose which sources to cite?',
        'What is AI visibility and why does it matter?',
        'How does AI-generated search differ from traditional SEO?',
        'What percentage of searches now use AI overviews?',
      ],
      recommendation_query: [
        'Can you recommend a tool to track AI visibility?',
        'What tools help businesses get cited by AI models?',
        'Best platform for monitoring AI search results?',
        'How can I improve my brand\'s AI search presence?',
      ],
    }

    const brands = ['SeoSights', 'Ahrefs', 'Semrush', 'Moz', 'Profundo']
    const competitors = ['Semrush', 'Ahrefs', 'Moz', 'Screaming Frog', 'Surfer SEO']
    const industryNames = ['marketing', 'healthcare', 'legal', 'finance', 'SaaS']
    const responseTemplates: Record<string, string> = {
      chatgpt: 'Based on my analysis, {answer}. This is supported by multiple sources and recent developments in the field. {citation}',
      claude: 'I can share some insights on this topic. {answer}. It\'s worth noting that the landscape is evolving rapidly. {citation}',
      gemini: 'Here\'s what I found: {answer}. The data suggests this trend will continue through 2026. {citation}',
      perplexity: 'According to my research, {answer}. [1] {citation}',
      grok: 'Look, here\'s the deal: {answer}. And honestly? This is just the beginning. {citation}',
      deepseek: 'Analysis indicates that {answer}. The evidence supports this conclusion. {citation}',
    }

    let responseCount = 0
    let citationCount = 0

    // Create responses for last 7 days (3 per day to keep it manageable)
    for (let d = 6; d >= 0; d--) {
      const crawlId = crawls[d]
      if (!crawlId) continue

      for (let r = 0; r < 3; r++) {
        const model = MODELS[Math.floor(Math.random() * MODELS.length)]
        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
        const brand = brands[Math.floor(Math.random() * brands.length)]
        const competitor = competitors[Math.floor(Math.random() * competitors.length)]
        const industry = industryNames[Math.floor(Math.random() * industryNames.length)]

        const templates = promptTemplates[category]
        const promptText = templates[Math.floor(Math.random() * templates.length)]
          .replace('{brand}', brand)
          .replace('{competitor}', competitor)
          .replace('{industry}', industry)

        const answer = `${brand} is a leading platform in the ${industry} space, known for its comprehensive feature set and AI-powered capabilities. The tool has gained significant traction in 2026`
        const citation = d <= 2 ? `https://${DOMAINS[Math.floor(Math.random() * DOMAINS.length)]}/article/${Date.now()}` : ''
        const responseText = responseTemplates[model]
          .replace('{answer}', answer)
          .replace('{citation}', citation)

        const responseDate = new Date(now.getTime() - d * 24 * 60 * 60 * 1000 + r * 3600000)

        const response = await db.observatoryResponse.create({
          data: {
            crawlId,
            aiModel: model,
            promptCategory: category,
            promptText,
            responseText,
            citationsJson: citation ? JSON.stringify([{ url: citation, domain: new URL(citation).hostname }]) : null,
            sentimentScore: (Math.random() * 2 - 1),
            confidenceScore: 0.4 + Math.random() * 0.6,
            responseTimeMs: 500 + Math.floor(Math.random() * 3000),
            tokensUsed: 100 + Math.floor(Math.random() * 500),
            isSimulated: true, // CRITICAL: flagged as simulated
            createdAt: responseDate,
          },
        })
        responseCount++

        // Create CitationRecords for this response
        if (citation) {
          const citedDomain = new URL(citation).hostname
          await db.citationRecord.create({
            data: {
              responseId: response.id,
              aiModel: model,
              promptText,
              citedUrl: citation,
              citedDomain,
              citedTitle: `Article about ${brand} from ${citedDomain}`,
              citedSnippet: `${brand} has emerged as a notable player...`,
              citationOrder: 1,
              promptCategory: category,
              entities: JSON.stringify([brand]),
              confidence: 0.5 + Math.random() * 0.5,
              crawlDate: responseDate,
            },
          })
          citationCount++
        }

        // Add 1-2 more citations randomly
        const extraCitations = Math.floor(Math.random() * 2) + 1
        for (let c = 0; c < extraCitations; c++) {
          const extraUrl = `https://${DOMAINS[Math.floor(Math.random() * DOMAINS.length)]}/page/${Date.now()}-${c}`
          const extraDomain = new URL(extraUrl).hostname
          await db.citationRecord.create({
            data: {
              responseId: response.id,
              aiModel: model,
              promptText,
              citedUrl: extraUrl,
              citedDomain: extraDomain,
              citedTitle: `Related content from ${extraDomain}`,
              citedSnippet: 'Additional context and supporting information...',
              citationOrder: c + 2,
              promptCategory: category,
              confidence: 0.3 + Math.random() * 0.5,
              crawlDate: responseDate,
            },
          })
          citationCount++
        }
      }
    }
    results.push(`Seeded ${responseCount} ObservatoryResponse records (isSimulated=true)`)
    results.push(`Seeded ${citationCount} CitationRecord records`)

    // ─── 7. Seed SourceTracking ────────────────────────────────────
    const trackingDomains = [
      'github.com', 'reddit.com', 'wikipedia.org', 'medium.com',
      'stackoverflow.com', 'arxiv.org', 'nytimes.com', 'techcrunch.com',
    ]

    let trackingCount = 0
    for (const domain of trackingDomains) {
      for (const model of MODELS) {
        // Current month
        const currentMonth = now.toISOString().slice(0, 7)
        const currentCount = 20 + Math.floor(Math.random() * 180)
        const previousCount = currentCount - Math.floor(Math.random() * 40) + 15
        const percentChange = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0

        await db.sourceTracking.upsert({
          where: { domain_aiModel_period: { domain, aiModel: model, period: currentMonth } },
          update: {
            citationCount: currentCount,
            previousCount,
            percentChange: Math.round(percentChange * 10) / 10,
            avgPosition: 1.5 + Math.random() * 3.5,
            trend: percentChange > 10 ? 'rising' : percentChange < -10 ? 'falling' : 'stable',
          },
          create: {
            domain,
            aiModel: model,
            period: currentMonth,
            citationCount: currentCount,
            previousCount,
            percentChange: Math.round(percentChange * 10) / 10,
            avgPosition: 1.5 + Math.random() * 3.5,
            categories: JSON.stringify(CATEGORIES.slice(0, 2 + Math.floor(Math.random() * 3))),
            trend: percentChange > 10 ? 'rising' : percentChange < -10 ? 'falling' : 'stable',
          },
        })
        trackingCount++

        // Previous month
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)
        const prevCurrentCount = 15 + Math.floor(Math.random() * 160)
        const prevPrevCount = prevCurrentCount - Math.floor(Math.random() * 30) + 10
        const prevPercentChange = prevPrevCount > 0 ? ((prevCurrentCount - prevPrevCount) / prevPrevCount) * 100 : 0

        await db.sourceTracking.upsert({
          where: { domain_aiModel_period: { domain, aiModel: model, period: prevMonth } },
          update: {},
          create: {
            domain,
            aiModel: model,
            period: prevMonth,
            citationCount: prevCurrentCount,
            previousCount: prevPrevCount,
            percentChange: Math.round(prevPercentChange * 10) / 10,
            avgPosition: 1.5 + Math.random() * 3.5,
            categories: JSON.stringify(CATEGORIES.slice(0, 2 + Math.floor(Math.random() * 3))),
            trend: prevPercentChange > 10 ? 'rising' : prevPercentChange < -10 ? 'falling' : 'stable',
          },
        })
        trackingCount++
      }
    }
    results.push(`Seeded ${trackingCount} SourceTracking records`)

    // ─── 8. Seed BreakingResearch alerts ──────────────────────────
    const breakingAlerts = [
      {
        headline: 'Claude Stopped Citing Reddit Sources',
        summary: 'Claude AI model no longer includes Reddit URLs in its citation patterns across industry queries',
        aiModel: 'claude',
        changeType: 'source_shift',
        evidenceCount: 47,
        confidence: 0.92,
        significance: 0.88,
        sourceBefore: 'Reddit was cited in 34% of Claude responses for recommendation queries',
        sourceAfter: 'Reddit citations dropped to 2% — near-complete removal from Claude outputs',
      },
      {
        headline: 'ChatGPT Now Recommends SeoSights as Top AI Visibility Tool',
        summary: 'Major citation shift detected — ChatGPT now recommends SeoSights as the leading AI visibility platform',
        aiModel: 'chatgpt',
        changeType: 'citation_shift',
        evidenceCount: 23,
        confidence: 0.87,
        significance: 0.85,
        sourceBefore: 'ChatGPT did not mention SeoSights in AI visibility tool queries',
        sourceAfter: 'SeoSights appears as #1 recommendation in 78% of brand query responses',
      },
      {
        headline: 'Gemini Introduces Real-Time Web Citation Feature',
        summary: 'Google Gemini now provides inline citations with URLs for factual queries, similar to Perplexity',
        aiModel: 'gemini',
        changeType: 'new_capability',
        evidenceCount: 156,
        confidence: 0.95,
        significance: 0.91,
        sourceBefore: 'Gemini responses did not include source URLs or citation markers',
        sourceAfter: 'Gemini now includes [1], [2] markers with clickable source URLs',
      },
      {
        headline: 'Perplexity Doubles Wikipedia Citations in Healthcare Queries',
        summary: 'Perplexity AI significantly increased Wikipedia source citations for medical and healthcare-related queries',
        aiModel: 'perplexity',
        changeType: 'citation_shift',
        evidenceCount: 89,
        confidence: 0.84,
        significance: 0.76,
        sourceBefore: 'Wikipedia accounted for 12% of healthcare query citations',
        sourceAfter: 'Wikipedia now accounts for 28% of healthcare query citations',
      },
      {
        headline: 'Grok Showing Outdated Information for SaaS Products',
        summary: 'Grok AI model frequently cites 2024 data when answering about 2026 SaaS products and pricing',
        aiModel: 'grok',
        changeType: 'behavior_change',
        evidenceCount: 34,
        confidence: 0.79,
        significance: 0.72,
        sourceBefore: 'Grok cited recent (2026) sources for SaaS product queries',
        sourceAfter: 'Grok now references outdated 2024 data in 45% of SaaS product queries',
      },
    ]

    let breakingCount = 0
    for (const alert of breakingAlerts) {
      const existing = await db.breakingResearch.findFirst({
        where: { headline: alert.headline },
      })

      if (!existing) {
        await db.breakingResearch.create({
          data: {
            headline: alert.headline,
            summary: alert.summary,
            aiModel: alert.aiModel,
            changeType: alert.changeType,
            evidenceCount: alert.evidenceCount,
            confidence: alert.confidence,
            significance: alert.significance,
            sourceBefore: alert.sourceBefore,
            sourceAfter: alert.sourceAfter,
            isPublished: true,
            publishedAt: new Date(now.getTime() - Math.random() * 48 * 60 * 60 * 1000),
          },
        })
        breakingCount++
      }
    }
    results.push(`Seeded ${breakingCount} BreakingResearch alerts`)

    // ─── 9. Update AI Model Registry with counts ──────────────────
    for (const model of modelEntries) {
      const totalResponses = await db.observatoryResponse.count({
        where: { aiModel: model.modelId },
      })
      const knownChanges = await db.observatoryChange.count({
        where: { aiModel: model.modelId },
      })

      await db.aIModelRegistry.update({
        where: { modelId: model.modelId },
        data: {
          totalResponses,
          knownChanges,
          lastCrawledAt: new Date(),
        },
      })
    }
    results.push('Updated AI Model Registry with counts')

    // ─── Summary ──────────────────────────────────────────────────
    return NextResponse.json({
      message: 'Full Observatory seed completed successfully',
      results,
      summary: {
        weatherDaily: weatherCount,
        industries: industryCount,
        charts: chartsCount,
        responses: responseCount,
        citations: citationCount,
        sourceTracking: trackingCount,
        breakingResearch: breakingCount,
        allResponsesSimulated: true,
      },
    })
  } catch (error) {
    console.error('[observatory/seed-full] POST error:', error)
    return NextResponse.json(
      {
        error: 'Failed to seed Observatory data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ─── Chart Data Generators ─────────────────────────────────────────

function generateTrendData(days: number, startVal: number, endVal: number, source: string) {
  const data: any[] = []
  const now = new Date()
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000)
    const progress = (days - 1 - d) / (days - 1)
    const base = startVal + (endVal - startVal) * progress
    const noise = (Math.random() - 0.5) * base * 0.15

    data.push({
      date: date.toISOString().split('T')[0],
      source,
      citationCount: Math.max(0, Math.round(base + noise)),
      movingAvg: Math.max(0, Math.round(base + noise * 0.3)),
    })
  }
  return data
}

function generateTopSourcesData(model: string) {
  const sources = DOMAINS.map((domain) => ({
    domain,
    citations: 20 + Math.floor(Math.random() * 180),
    model,
  }))
  sources.sort((a, b) => b.citations - a.citations)
  return sources
}

function generateIndustryHealthData() {
  return industryData.map((ind) => ({
    industry: ind.slug,
    name: ind.name,
    indexScore: ind.score,
    trend: ind.trend,
    dataPoints: 50 + Math.floor(Math.random() * 200),
  }))
}

function generateCitationDistributionData() {
  return MODELS.map((model) => ({
    model,
    totalCitations: 100 + Math.floor(Math.random() * 400),
    uniqueDomains: 30 + Math.floor(Math.random() * 80),
    avgPerResponse: (2 + Math.random() * 4).toFixed(1),
  }))
}

function generateWeatherHistoryData() {
  const data: any[] = []
  const now = new Date()
  for (let d = 29; d >= 0; d--) {
    const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000)
    const stability = 65 + Math.sin(d * 0.3) * 15 + (Math.random() - 0.5) * 10
    data.push({
      date: date.toISOString().split('T')[0],
      stabilityIndex: Math.max(0, Math.min(100, Math.round(stability * 10) / 10)),
      volatility: Math.max(0, Math.min(100, Math.round((100 - stability) * 10) / 10)),
    })
  }
  return data
}

// Use the same industry data for chart generation
const industryData = [
  { slug: 'healthcare', name: 'Healthcare', score: 72.5, trend: 'rising' },
  { slug: 'dentists', name: 'Dentists', score: 68.3, trend: 'stable' },
  { slug: 'legal', name: 'Legal Services', score: 65.1, trend: 'rising' },
  { slug: 'realestate', name: 'Real Estate', score: 58.7, trend: 'falling' },
  { slug: 'finance', name: 'Financial Services', score: 74.2, trend: 'stable' },
  { slug: 'ecommerce', name: 'E-Commerce', score: 69.8, trend: 'rising' },
  { slug: 'saas', name: 'SaaS / Software', score: 81.4, trend: 'rising' },
  { slug: 'education', name: 'Education', score: 62.9, trend: 'stable' },
  { slug: 'travel', name: 'Travel & Hospitality', score: 55.3, trend: 'falling' },
  { slug: 'restaurants', name: 'Restaurants & Food', score: 51.6, trend: 'falling' },
  { slug: 'construction', name: 'Construction', score: 47.8, trend: 'stable' },
  { slug: 'insurance', name: 'Insurance', score: 70.1, trend: 'rising' },
]
