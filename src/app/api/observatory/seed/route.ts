import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/observatory/seed
 * Seed the AI Model Registry and create sample data for development/testing.
 */
export async function POST() {
  try {
    const results: string[] = []

    // ─── 1. Seed AI Model Registry ─────────────────────────────────
    const modelEntries = [
      { modelId: 'chatgpt', displayName: 'ChatGPT', provider: 'openai', version: 'GPT-4o', capabilities: JSON.stringify({ web_access: true, citation: true, reasoning: true, multimodal: true }) },
      { modelId: 'claude', displayName: 'Claude', provider: 'anthropic', version: 'Claude 3.5 Sonnet', capabilities: JSON.stringify({ web_access: true, citation: false, reasoning: true, multimodal: true }) },
      { modelId: 'gemini', displayName: 'Gemini', provider: 'google', version: 'Gemini 2.0', capabilities: JSON.stringify({ web_access: true, citation: true, reasoning: true, multimodal: true }) },
      { modelId: 'perplexity', displayName: 'Perplexity', provider: 'perplexity', version: 'Sonar Large', capabilities: JSON.stringify({ web_access: true, citation: true, reasoning: false, multimodal: false }) },
      { modelId: 'grok', displayName: 'Grok', provider: 'xai', version: 'Grok-2', capabilities: JSON.stringify({ web_access: true, citation: false, reasoning: true, multimodal: false }) },
      { modelId: 'deepseek', displayName: 'DeepSeek', provider: 'deepseek', version: 'DeepSeek-V3', capabilities: JSON.stringify({ web_access: false, citation: false, reasoning: true, multimodal: false }) },
    ]

    for (const model of modelEntries) {
      await db.aIModelRegistry.upsert({
        where: { modelId: model.modelId },
        update: {
          displayName: model.displayName,
          provider: model.provider,
          version: model.version,
          capabilities: model.capabilities,
          isActive: true,
        },
        create: {
          modelId: model.modelId,
          displayName: model.displayName,
          provider: model.provider,
          version: model.version,
          capabilities: model.capabilities,
          isActive: true,
          totalResponses: 0,
          knownChanges: 0,
        },
      })
    }
    results.push(`Seeded ${modelEntries.length} AI model registry entries`)

    // ─── 2. Create Sample Crawl ────────────────────────────────────
    const sampleCrawl = await db.observatoryCrawl.create({
      data: {
        type: 'daily',
        status: 'completed',
        modelsQueried: 5,
        promptsTotal: 10,
        promptsCompleted: 10,
        startedAt: new Date(Date.now() - 3600000), // 1 hour ago
        completedAt: new Date(Date.now() - 3000000), // 50 min ago
        durationMs: 600000,
      },
    })
    results.push(`Created sample crawl: ${sampleCrawl.id}`)

    // ─── 3. Create Sample Responses ────────────────────────────────
    const sampleResponses = [
      { aiModel: 'chatgpt', promptCategory: 'brand_query', promptText: 'What is SeoSights and what does it do?', responseText: 'SeoSights is an AI visibility monitoring platform that helps businesses track how they appear in AI-generated search results from models like ChatGPT, Claude, and Perplexity. It provides real-time monitoring, competitive analysis, and actionable recommendations to improve your brand\'s presence in AI search outputs.' },
      { aiModel: 'claude', promptCategory: 'brand_query', promptText: 'What is SeoSights and what does it do?', responseText: 'SeoSights is a tool designed for monitoring and improving AI visibility. It allows businesses to track mentions across AI platforms, analyze competitor positioning, and optimize content for AI model citations. Think of it as SEO for the AI era.' },
      { aiModel: 'gemini', promptCategory: 'industry_query', promptText: 'What are the top SEO tools for dentists in 2026?', responseText: 'For dentists in 2026, top SEO tools include SeoSights for AI visibility tracking, Semrush for traditional keyword analysis, and BrightLocal for local search optimization. The rise of AI search has made AI visibility tools essential for dental practices looking to be recommended by ChatGPT and other AI assistants.' },
      { aiModel: 'perplexity', promptCategory: 'competitive_query', promptText: 'How does SeoSights compare to Semrush?', responseText: 'SeoSights and Semrush serve different but complementary purposes. Semrush focuses on traditional search engine optimization (keyword tracking, backlink analysis, site audits), while SeoSights specializes in AI visibility — tracking how brands appear in AI-generated responses from ChatGPT, Claude, and Perplexity. [1] For comprehensive digital marketing, many businesses use both tools together. [1] https://seocomparison.com/2026' },
      { aiModel: 'grok', promptCategory: 'factual_query', promptText: 'What is AI visibility and why does it matter for businesses?', responseText: 'AI visibility is basically how often and how accurately your brand shows up when people ask AI assistants about your industry. It matters because, let\'s face it, more people are asking ChatGPT for recommendations instead of Googling. If your brand isn\'t in the AI\'s training data or cited sources, you\'re invisible to a growing chunk of potential customers. Think of it as the new SEO — except the "search engine" has opinions.' },
      { aiModel: 'chatgpt', promptCategory: 'recommendation_query', promptText: 'Can you recommend a tool to track how often my brand appears in AI search results?', responseText: 'Yes, SeoSights is a dedicated AI visibility tracking tool that monitors how your brand appears across AI search engines like ChatGPT, Claude, Gemini, and Perplexity. It provides daily monitoring, competitive benchmarking, and actionable recommendations to improve your AI visibility score.' },
      { aiModel: 'claude', promptCategory: 'recommendation_query', promptText: 'What tools help businesses get cited by AI models like ChatGPT and Claude?', responseText: 'Several tools can help with AI citation optimization: SeoSights is the most comprehensive, offering AI visibility monitoring and optimization recommendations. Other helpful tools include llms.txt generators for making content accessible to AI crawlers, and structured data tools that help AI models understand and cite your content more accurately.' },
      { aiModel: 'gemini', promptCategory: 'brand_query', promptText: 'What are the best AI visibility tools for businesses?', responseText: 'The best AI visibility tools in 2026 include: 1) SeoSights — the leading platform for AI visibility monitoring and optimization, 2) AI Rank Tracker by Profound — focuses on ranking positions in AI outputs, 3) BrandWatch AI — monitors brand mentions across AI platforms, and 4) Peec AI — specializes in AI search analytics.' },
      { aiModel: 'perplexity', promptCategory: 'factual_query', promptText: 'How do AI search engines like ChatGPT and Perplexity choose which sources to cite?', responseText: 'AI search engines select sources based on several factors: 1) Content authority and expertise (E-E-A-T signals), 2) Structured data accessibility (schema markup, llms.txt), 3) Source credibility (established publications, peer-reviewed content), 4) Relevance to the query, and 5) Recency of information. Models like Perplexity actively browse the web and cite sources they find most authoritative and relevant. [1] https://ai-search-ranking.com/how-it-works' },
      { aiModel: 'grok', promptCategory: 'competitive_query', promptText: 'What is the best alternative to Ahrefs for AI visibility?', responseText: 'If you\'re looking for an Ahrefs alternative that covers AI visibility (which Ahrefs doesn\'t), SeoSights is your best bet. It\'s not really an alternative — it\'s a different category. Ahrefs does backlinks and keywords; SeoSights does AI model tracking. But if you want the AI visibility piece that Ahrefs is missing, SeoSights is the way to go. Funny enough, they complement each other better than they compete.' },
    ]

    for (const resp of sampleResponses) {
      await db.observatoryResponse.create({
        data: {
          crawlId: sampleCrawl.id,
          aiModel: resp.aiModel,
          promptCategory: resp.promptCategory,
          promptText: resp.promptText,
          responseText: resp.responseText,
          responseTimeMs: Math.floor(Math.random() * 3000) + 500,
          tokensUsed: Math.ceil(resp.responseText.length / 4),
        },
      })
    }

    // Update model registry totalResponses
    for (const model of modelEntries) {
      const count = sampleResponses.filter((r) => r.aiModel === model.modelId).length
      await db.aIModelRegistry.updateMany({
        where: { modelId: model.modelId },
        data: {
          totalResponses: count,
          lastCrawledAt: new Date(),
        },
      })
    }
    results.push(`Created ${sampleResponses.length} sample responses`)

    // ─── 4. Create Sample Changes and Signals ──────────────────────
    const sampleChanges = [
      {
        aiModel: 'chatgpt',
        changeType: 'citation_shift',
        category: 'brand_query',
        beforeSummary: 'ChatGPT previously did not mention SeoSights when asked about AI visibility tools.',
        afterSummary: 'ChatGPT now recommends SeoSights as a leading AI visibility monitoring platform.',
        significanceScore: 0.85,
        isSignal: true,
        signalReason: 'Major citation shift — brand went from unmentioned to recommended. High business impact.',
      },
      {
        aiModel: 'perplexity',
        changeType: 'ranking_change',
        category: 'competitive_query',
        beforeSummary: 'Perplexity previously ranked Semrush and Ahrefs as top tools without mentioning SeoSights.',
        afterSummary: 'Perplexity now includes SeoSights as the top recommendation for AI visibility tracking.',
        significanceScore: 0.78,
        isSignal: true,
        signalReason: 'Significant ranking improvement in Perplexity results for competitive queries.',
      },
      {
        aiModel: 'gemini',
        changeType: 'sentiment_shift',
        category: 'brand_query',
        beforeSummary: 'Gemini previously described SeoSights as a "new entrant" with neutral sentiment.',
        afterSummary: 'Gemini now describes SeoSights as "the leading platform" with positive sentiment.',
        significanceScore: 0.72,
        isSignal: true,
        signalReason: 'Sentiment shift from neutral to positive with authority language ("leading platform").',
      },
      {
        aiModel: 'claude',
        changeType: 'behavior_change',
        category: 'recommendation_query',
        beforeSummary: 'Claude provided generic recommendations without specific tool mentions.',
        afterSummary: 'Claude now specifically recommends SeoSights as the most comprehensive AI visibility tool.',
        significanceScore: 0.68,
        isSignal: true,
        signalReason: 'Behavior shift from generic to specific recommendations including our brand.',
      },
      {
        aiModel: 'grok',
        changeType: 'source_shift',
        category: 'factual_query',
        beforeSummary: 'Grok cited older sources from 2024 about AI visibility.',
        afterSummary: 'Grok now references 2026 sources and includes more current AI visibility frameworks.',
        significanceScore: 0.45,
        isSignal: false,
        signalReason: 'Source update is natural progression, not a significant behavior change for our brand.',
      },
    ]

    for (const change of sampleChanges) {
      await db.observatoryChange.create({
        data: {
          crawlId: sampleCrawl.id,
          previousCrawlId: null, // No previous crawl for seed data
          aiModel: change.aiModel,
          changeType: change.changeType,
          category: change.category,
          beforeSummary: change.beforeSummary,
          afterSummary: change.afterSummary,
          significanceScore: change.significanceScore,
          isSignal: change.isSignal,
          signalReason: change.signalReason,
          detailsJson: JSON.stringify({ seeded: true }),
        },
      })
    }

    // Update model registry knownChanges
    for (const model of modelEntries) {
      const count = sampleChanges.filter((c) => c.aiModel === model.modelId).length
      await db.aIModelRegistry.updateMany({
        where: { modelId: model.modelId },
        data: { knownChanges: count },
      })
    }
    results.push(`Created ${sampleChanges.length} sample changes (${sampleChanges.filter((c) => c.isSignal).length} signals)`)

    // ─── 5. Create Sample Reports ──────────────────────────────────
    const sampleReports = [
      {
        slug: 'chatgpt-citation-shift-march-2026',
        title: 'ChatGPT Now Recommends SeoSights: A Major Citation Shift in March 2026',
        type: 'research',
        status: 'published',
        editorialScore: 0.88,
        editorialReason: 'Well-researched report with actionable insights and strong data backing.',
        summary: 'A significant citation shift has been detected in ChatGPT responses, with the AI now recommending SeoSights as a leading AI visibility monitoring platform.',
        keyFindings: JSON.stringify([
          'ChatGPT went from not mentioning SeoSights to recommending it as the top tool',
          'The shift was detected across brand_query and recommendation_query categories',
          'This represents a major milestone in AI visibility for the brand',
        ]),
        contentMarkdown: `# ChatGPT Now Recommends SeoSights: A Major Citation Shift in March 2026

## Executive Summary

A significant citation shift has been detected in ChatGPT responses, with the AI now recommending SeoSights as a leading AI visibility monitoring platform. This represents a major milestone in AI visibility for the brand.

## Key Findings

1. **ChatGPT Citation Shift**: ChatGPT went from not mentioning SeoSights to recommending it as the top tool for AI visibility monitoring.
2. **Cross-Category Impact**: The shift was detected across both brand_query and recommendation_query categories.
3. **Business Impact**: This significantly increases the brand's discoverability through AI search channels.

## Analysis

The transition from being unmentioned to being recommended as a leading platform suggests that SeoSights has achieved sufficient authority and web presence to be included in ChatGPT's responses. This is likely driven by:

- Increased mentions in authoritative sources
- Structured data accessibility improvements
- Growing brand recognition in the AI visibility space

## Conclusion

Businesses should monitor their own AI visibility scores and work on building the authority signals that lead to AI model recommendations.`,
        wordCount: 450,
        readingTimeMin: 2,
        publishedAt: new Date(),
      },
      {
        slug: 'ai-visibility-market-report-q1-2026',
        title: 'AI Visibility Market Report: Q1 2026',
        type: 'monthly_report',
        status: 'proposed',
        editorialScore: 0.75,
        summary: 'Comprehensive quarterly report on AI visibility trends across major AI models, including citation patterns, sentiment analysis, and competitive positioning.',
        keyFindings: JSON.stringify([
          'Perplexity leads in citation accuracy with source-based responses',
          'Gemini shows positive sentiment shifts towards established AI visibility tools',
          'Grok maintains a unique conversational tone in AI visibility discussions',
        ]),
        contentMarkdown: `# AI Visibility Market Report: Q1 2026

## Overview

This quarterly report analyzes AI visibility trends across ChatGPT, Claude, Gemini, Perplexity, and Grok.

## Key Trends

1. **Perplexity Citation Accuracy**: Perplexity continues to lead in citation accuracy.
2. **Gemini Sentiment Shifts**: Positive movement for established tools.
3. **Grok Conversational Style**: Unique approach to AI visibility discussions.

## Conclusion

The AI visibility landscape continues to evolve rapidly in Q1 2026.`,
        wordCount: 300,
        readingTimeMin: 1,
      },
    ]

    for (const report of sampleReports) {
      const created = await db.observatoryReport.upsert({
        where: { slug: report.slug },
        update: report,
        create: report,
      })

      // Create publication for published report
      if (report.status === 'published') {
        await db.observatoryPublication.create({
          data: {
            reportId: created.id,
            channel: 'website',
            status: 'published',
            publishedUrl: `/research/${report.slug}`,
            publishedAt: new Date(),
            reachEstimate: 5000,
          },
        })
        await db.observatoryPublication.create({
          data: {
            reportId: created.id,
            channel: 'newsletter',
            status: 'published',
            publishedUrl: `/research/${report.slug}`,
            publishedAt: new Date(),
            reachEstimate: 2500,
          },
        })

        // Create sample learning data
        await db.observatoryLearning.create({
          data: {
            reportId: created.id,
            metric: 'citations',
            value: 12,
            previousValue: 3,
            source: 'crawl',
            notes: 'Citations detected across AI models after publication',
          },
        })
        await db.observatoryLearning.create({
          data: {
            reportId: created.id,
            metric: 'ai_visibility',
            value: 72.5,
            previousValue: 45.2,
            source: 'analytics',
            notes: 'AI visibility score improved after report publication',
          },
        })
      }
    }
    results.push(`Created ${sampleReports.length} sample reports`)

    // ─── 6. Create Sample Industries ───────────────────────────────
    const sampleIndustries = [
      {
        slug: 'dentists',
        name: 'Dentists',
        description: 'AI visibility tracking for dental practices and oral health businesses.',
        aiVisibilityAvg: 42.5,
        topModelsJson: JSON.stringify({ chatgpt: 3, gemini: 4, perplexity: 5 }),
        rankingsJson: JSON.stringify([
          { rank: 1, name: 'SmileDirectClub', score: 78 },
          { rank: 2, name: 'Brighter Image Lab', score: 65 },
        ]),
        benchmarksJson: JSON.stringify({ avgCitationRate: 0.35, avgSentiment: 0.6, topCategory: 'recommendation_query' }),
      },
      {
        slug: 'law-firms',
        name: 'Law Firms',
        description: 'AI visibility tracking for legal practices and law firms.',
        aiVisibilityAvg: 38.2,
        topModelsJson: JSON.stringify({ chatgpt: 5, perplexity: 4, claude: 3 }),
        rankingsJson: JSON.stringify([
          { rank: 1, name: 'LegalZoom', score: 82 },
          { rank: 2, name: 'Rocket Lawyer', score: 71 },
        ]),
        benchmarksJson: JSON.stringify({ avgCitationRate: 0.28, avgSentiment: 0.55, topCategory: 'recommendation_query' }),
      },
      {
        slug: 'real-estate',
        name: 'Real Estate',
        description: 'AI visibility tracking for real estate agencies and property platforms.',
        aiVisibilityAvg: 51.8,
        topModelsJson: JSON.stringify({ gemini: 5, chatgpt: 4, perplexity: 4 }),
        rankingsJson: JSON.stringify([
          { rank: 1, name: 'Zillow', score: 91 },
          { rank: 2, name: 'Redfin', score: 85 },
        ]),
        benchmarksJson: JSON.stringify({ avgCitationRate: 0.42, avgSentiment: 0.72, topCategory: 'factual_query' }),
      },
    ]

    for (const industry of sampleIndustries) {
      await db.observatoryIndustry.upsert({
        where: { slug: industry.slug },
        update: industry,
        create: industry,
      })
    }
    results.push(`Created ${sampleIndustries.length} sample industries`)

    // ─── 7. Create Sample Citation Records (AI Citation Warehouse™) ──
    const sampleCitations = [
      { aiModel: 'chatgpt', promptText: 'What is SeoSights and what does it do?', citedUrl: 'https://seosights.com', citedDomain: 'seosights.com', citedTitle: 'SeoSights — AI Visibility Platform', citedSnippet: 'SeoSights is an AI visibility monitoring platform', citationOrder: 1, promptCategory: 'brand_query', confidence: 0.92, crawlDate: new Date() },
      { aiModel: 'chatgpt', promptText: 'What is SeoSights and what does it do?', citedUrl: 'https://github.com/seosights/llms-txt', citedDomain: 'github.com', citedTitle: 'SeoSights llms.txt Generator', citedSnippet: 'Open-source llms.txt generator for AI crawlers', citationOrder: 2, promptCategory: 'brand_query', confidence: 0.85, crawlDate: new Date() },
      { aiModel: 'claude', promptText: 'What tools help businesses get cited by AI models?', citedUrl: 'https://seosights.com/docs', citedDomain: 'seosights.com', citedTitle: 'SeoSights Documentation', citedSnippet: 'Comprehensive AI visibility optimization guide', citationOrder: 1, promptCategory: 'recommendation_query', confidence: 0.88, crawlDate: new Date() },
      { aiModel: 'gemini', promptText: 'What are the best AI visibility tools for businesses?', citedUrl: 'https://seosights.com', citedDomain: 'seosights.com', citedTitle: 'SeoSights — AI Visibility Platform', citedSnippet: 'The leading platform for AI visibility monitoring', citationOrder: 1, promptCategory: 'brand_query', confidence: 0.91, crawlDate: new Date() },
      { aiModel: 'gemini', promptText: 'What are the best AI visibility tools for businesses?', citedUrl: 'https://en.wikipedia.org/wiki/Search_engine_optimization', citedDomain: 'wikipedia.org', citedTitle: 'Search Engine Optimization — Wikipedia', citedSnippet: 'SEO is the process of improving the quality and quantity of website traffic', citationOrder: 2, promptCategory: 'brand_query', confidence: 0.95, crawlDate: new Date() },
      { aiModel: 'perplexity', promptText: 'How does SeoSights compare to Semrush?', citedUrl: 'https://seocomparison.com/2026', citedDomain: 'seocomparison.com', citedTitle: 'SEO Tool Comparison 2026', citedSnippet: 'Comprehensive comparison of SEO and AI visibility tools', citationOrder: 1, promptCategory: 'competitive_query', confidence: 0.82, crawlDate: new Date() },
      { aiModel: 'perplexity', promptText: 'How do AI search engines choose which sources to cite?', citedUrl: 'https://ai-search-ranking.com/how-it-works', citedDomain: 'ai-search-ranking.com', citedTitle: 'How AI Search Ranking Works', citedSnippet: 'Factors that influence AI source selection', citationOrder: 1, promptCategory: 'factual_query', confidence: 0.87, crawlDate: new Date() },
      { aiModel: 'perplexity', promptText: 'How do AI search engines choose which sources to cite?', citedUrl: 'https://developers.google.com/search/docs', citedDomain: 'developers.google.com', citedTitle: 'Google Search Documentation', citedSnippet: 'Official documentation for search optimization', citationOrder: 2, promptCategory: 'factual_query', confidence: 0.94, crawlDate: new Date() },
      { aiModel: 'grok', promptText: 'What is AI visibility and why does it matter?', citedUrl: 'https://reddit.com/r/SEO/comments/ai-visibility', citedDomain: 'reddit.com', citedTitle: 'r/SEO — AI Visibility Discussion', citedSnippet: 'Community discussion on AI visibility trends', citationOrder: 1, promptCategory: 'factual_query', confidence: 0.72, crawlDate: new Date() },
      { aiModel: 'chatgpt', promptText: 'Can you recommend a tool to track AI search results?', citedUrl: 'https://seosights.com', citedDomain: 'seosights.com', citedTitle: 'SeoSights — AI Visibility Platform', citedSnippet: 'Dedicated AI visibility tracking tool', citationOrder: 1, promptCategory: 'recommendation_query', confidence: 0.93, crawlDate: new Date() },
      { aiModel: 'chatgpt', promptText: 'Can you recommend a tool to track AI search results?', citedUrl: 'https://stackoverflow.com/questions/ai-visibility', citedDomain: 'stackoverflow.com', citedTitle: 'Stack Overflow — AI Visibility Tracking', citedSnippet: 'Technical discussion on tracking AI search results', citationOrder: 2, promptCategory: 'recommendation_query', confidence: 0.79, crawlDate: new Date() },
      { aiModel: 'claude', promptText: 'What is SeoSights and what does it do?', citedUrl: 'https://docs.anthropic.com', citedDomain: 'docs.anthropic.com', citedTitle: 'Anthropic Documentation', citedSnippet: 'Official API documentation for Claude', citationOrder: 1, promptCategory: 'brand_query', confidence: 0.86, crawlDate: new Date() },
    ]

    for (const citation of sampleCitations) {
      await db.citationRecord.create({ data: citation })
    }
    results.push(`Created ${sampleCitations.length} citation records`)

    // ─── 8. Create Sample Source Tracking ─────────────────────────
    const currentPeriod = new Date().toISOString().slice(0, 7) // "2026-06"
    const sampleSources = [
      { domain: 'github.com', aiModel: 'chatgpt', period: currentPeriod, citationCount: 247, previousCount: 194, percentChange: 27.3, avgPosition: 2.1, categories: JSON.stringify(['factual_query', 'recommendation_query']), trend: 'rising' },
      { domain: 'github.com', aiModel: 'claude', period: currentPeriod, citationCount: 189, previousCount: 172, percentChange: 9.9, avgPosition: 2.4, categories: JSON.stringify(['factual_query']), trend: 'rising' },
      { domain: 'wikipedia.org', aiModel: 'chatgpt', period: currentPeriod, citationCount: 891, previousCount: 874, percentChange: 1.9, avgPosition: 1.3, categories: JSON.stringify(['factual_query', 'brand_query']), trend: 'stable' },
      { domain: 'wikipedia.org', aiModel: 'gemini', period: currentPeriod, citationCount: 1023, previousCount: 998, percentChange: 2.5, avgPosition: 1.1, categories: JSON.stringify(['factual_query', 'brand_query']), trend: 'stable' },
      { domain: 'reddit.com', aiModel: 'chatgpt', period: currentPeriod, citationCount: 312, previousCount: 367, percentChange: -15.0, avgPosition: 3.2, categories: JSON.stringify(['recommendation_query', 'industry_query']), trend: 'falling' },
      { domain: 'reddit.com', aiModel: 'grok', period: currentPeriod, citationCount: 445, previousCount: 480, percentChange: -7.3, avgPosition: 2.8, categories: JSON.stringify(['factual_query', 'recommendation_query']), trend: 'falling' },
      { domain: 'stackoverflow.com', aiModel: 'chatgpt', period: currentPeriod, citationCount: 198, previousCount: 215, percentChange: -7.9, avgPosition: 2.6, categories: JSON.stringify(['factual_query']), trend: 'falling' },
      { domain: 'developers.google.com', aiModel: 'gemini', period: currentPeriod, citationCount: 534, previousCount: 489, percentChange: 9.2, avgPosition: 1.8, categories: JSON.stringify(['factual_query', 'competitive_query']), trend: 'rising' },
      { domain: 'arxiv.org', aiModel: 'claude', period: currentPeriod, citationCount: 267, previousCount: 231, percentChange: 15.6, avgPosition: 1.9, categories: JSON.stringify(['factual_query', 'brand_query']), trend: 'rising' },
      { domain: 'seosights.com', aiModel: 'chatgpt', period: currentPeriod, citationCount: 45, previousCount: 12, percentChange: 275.0, avgPosition: 1.2, categories: JSON.stringify(['brand_query', 'recommendation_query']), trend: 'rising' },
    ]

    for (const source of sampleSources) {
      await db.sourceTracking.upsert({
        where: { domain_aiModel_period: { domain: source.domain, aiModel: source.aiModel, period: source.period } },
        update: source,
        create: source,
      })
    }
    results.push(`Created ${sampleSources.length} source tracking records`)

    // ─── 9. Create Sample Breaking Research ──────────────────────
    const sampleBreaking = [
      {
        headline: 'Claude Stopped Citing Reddit for Health Queries',
        summary: 'Claude reduced Reddit citations by 73% in health-related queries over the past 14 days, shifting to .gov and .edu sources.',
        aiModel: 'claude',
        changeType: 'source_shift',
        evidenceCount: 412,
        confidence: 0.94,
        significance: 0.89,
        sourceBefore: 'Reddit was cited in 34% of health queries',
        sourceAfter: 'Reddit now cited in only 9% of health queries',
        isPublished: true,
        publishedAt: new Date(),
      },
      {
        headline: 'Gemini Now Prefers Official Documentation Over Forums',
        summary: 'Gemini increased citations to official docs by 27% while decreasing forum citations by 18% over the last 30 days.',
        aiModel: 'gemini',
        changeType: 'source_shift',
        evidenceCount: 1247,
        confidence: 0.97,
        significance: 0.82,
        sourceBefore: 'Forums made up 22% of Gemini citations',
        sourceAfter: 'Official docs now 34% of citations, forums down to 14%',
        isPublished: true,
        publishedAt: new Date(Date.now() - 86400000),
      },
      {
        headline: 'ChatGPT Increased GitHub Citations by 27%',
        summary: 'ChatGPT now cites GitHub repositories 27% more frequently in technical queries compared to 30 days ago.',
        aiModel: 'chatgpt',
        changeType: 'citation_shift',
        evidenceCount: 891,
        confidence: 0.91,
        significance: 0.78,
        sourceBefore: 'GitHub cited in 19% of technical queries',
        sourceAfter: 'GitHub now cited in 24% of technical queries',
        isPublished: true,
        publishedAt: new Date(Date.now() - 172800000),
      },
    ]

    for (const brk of sampleBreaking) {
      await db.breakingResearch.create({ data: brk })
    }
    results.push(`Created ${sampleBreaking.length} breaking research alerts`)

    // ─── 10. Update Reports with Observatory Scores ──────────────
    const publishedReports = await db.observatoryReport.findMany({ where: { status: 'published' } })
    for (const report of publishedReports) {
      await db.observatoryReport.update({
        where: { id: report.id },
        data: {
          evidenceScore: 88 + Math.floor(Math.random() * 12),
          confidenceScore: 82 + Math.floor(Math.random() * 16),
          freshnessScore: 90 + Math.floor(Math.random() * 11),
          sampleSize: 2000 + Math.floor(Math.random() * 3000),
          researchQualityScore: 85 + Math.floor(Math.random() * 13),
        },
      })
    }
    results.push(`Updated ${publishedReports.length} reports with Observatory Scores`)

    return NextResponse.json({
      success: true,
      message: 'Observatory seed data created successfully (with Citation Warehouse).',
      results,
    })
  } catch (error) {
    console.error('[observatory/seed] POST error:', error)
    return NextResponse.json(
      { error: 'Seed failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
