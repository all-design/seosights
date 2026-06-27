import { db } from '../src/lib/db'

async function main() {
  console.log('🌱 Seeding P0 demo data...')

  const domain = 'example.com'
  const userId = 'demo-user-pro'
  const now = new Date()
  const oneHour = 3600000
  const oneDay = 86400000

  // ─── Seed Demo User ───────────────────────────────────────
  console.log('  Creating Demo User...')
  await db.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: 'demo@seosights.io',
      name: 'Demo User',
      role: 'user',
      tier: 'pro',
      subscriptionStatus: 'active',
    },
  })

  // ─── Seed VisibilitySnapshots ──────────────────────────────
  console.log('  Creating VisibilitySnapshots...')

  // Current snapshot
  await db.visibilitySnapshot.upsert({
    where: { id: 'snap-current' },
    update: {},
    create: {
      id: 'snap-current',
      userId,
      domain,
      overallScore: 71,
      trustScore: 63,
      freshnessScore: 75,
      authorityScore: 65,
      perEngine: JSON.stringify({ chatgpt: 72, claude: 55, gemini: 61, perplexity: 78, copilot: 48 }),
      dataSource: 'live',
      capturedAt: new Date(now.getTime() - 2 * oneHour),
    },
  })

  // Yesterday's snapshot
  await db.visibilitySnapshot.upsert({
    where: { id: 'snap-yesterday' },
    update: {},
    create: {
      id: 'snap-yesterday',
      userId,
      domain,
      overallScore: 68,
      trustScore: 60,
      freshnessScore: 72,
      authorityScore: 62,
      perEngine: JSON.stringify({ chatgpt: 68, claude: 51, gemini: 58, perplexity: 74, copilot: 45 }),
      dataSource: 'live',
      capturedAt: new Date(now.getTime() - oneDay - 2 * oneHour),
    },
  })

  // 7 days ago snapshot
  await db.visibilitySnapshot.upsert({
    where: { id: 'snap-7days' },
    update: {},
    create: {
      id: 'snap-7days',
      userId,
      domain,
      overallScore: 62,
      trustScore: 56,
      freshnessScore: 66,
      authorityScore: 58,
      perEngine: JSON.stringify({ chatgpt: 62, claude: 47, gemini: 52, perplexity: 68, copilot: 40 }),
      dataSource: 'live',
      capturedAt: new Date(now.getTime() - 7 * oneDay),
    },
  })

  // 30 days ago snapshot
  await db.visibilitySnapshot.upsert({
    where: { id: 'snap-30days' },
    update: {},
    create: {
      id: 'snap-30days',
      userId,
      domain,
      overallScore: 52,
      trustScore: 48,
      freshnessScore: 55,
      authorityScore: 50,
      perEngine: JSON.stringify({ chatgpt: 52, claude: 40, gemini: 44, perplexity: 58, copilot: 35 }),
      dataSource: 'estimated',
      capturedAt: new Date(now.getTime() - 30 * oneDay),
    },
  })

  // ─── Seed CitationEvents ───────────────────────────────────
  console.log('  Creating CitationEvents...')

  const citationEvents = [
    // ChatGPT events
    { engine: 'chatgpt', eventType: 'cited', delta: 6, prompt: 'What are the best SEO tools?', pageUrl: '/faq', competitor: null },
    { engine: 'chatgpt', eventType: 'cited', delta: 4, prompt: 'How to improve AI visibility?', pageUrl: '/blog/ai-visibility-guide', competitor: null },
    { engine: 'chatgpt', eventType: 'rank_up', delta: 3, prompt: 'SEO audit tools comparison', pageUrl: null, competitor: null },
    { engine: 'chatgpt', eventType: 'first_mention', delta: 8, prompt: 'Best SEO platform for agencies', pageUrl: '/pricing', competitor: null },
    { engine: 'chatgpt', eventType: 'cited', delta: 2, prompt: 'How to get cited by ChatGPT?', pageUrl: '/blog/get-cited-by-ai', competitor: null },

    // Claude events
    { engine: 'claude', eventType: 'cited', delta: 5, prompt: 'What is GEO optimization?', pageUrl: '/blog/geo-optimization', competitor: null },
    { engine: 'claude', eventType: 'cited', delta: 3, prompt: 'AEO strategies for 2025', pageUrl: '/blog/aeo-strategies', competitor: null },
    { engine: 'claude', eventType: 'rank_up', delta: 2, prompt: 'AI search optimization tools', pageUrl: null, competitor: null },
    { engine: 'claude', eventType: 'uncited', delta: -3, prompt: 'SEO vs AEO vs GEO comparison', pageUrl: '/pricing', competitor: null },

    // Gemini events
    { engine: 'gemini', eventType: 'cited', delta: 4, prompt: 'How to optimize for Google AI?', pageUrl: '/blog/gemini-optimization', competitor: null },
    { engine: 'gemini', eventType: 'rank_up', delta: 3, prompt: 'AI visibility tracking tools', pageUrl: null, competitor: null },
    { engine: 'gemini', eventType: 'cited', delta: 2, prompt: 'What is llms.txt?', pageUrl: '/blog/llms-txt-guide', competitor: null },
    { engine: 'gemini', eventType: 'rank_down', delta: -2, prompt: 'SEO audit platforms review', pageUrl: null, competitor: 'competitor-alpha.com' },

    // Perplexity events
    { engine: 'perplexity', eventType: 'cited', delta: 7, prompt: 'Best AI SEO tools 2025', pageUrl: '/blog/best-ai-seo-tools', competitor: null },
    { engine: 'perplexity', eventType: 'first_mention', delta: 10, prompt: 'How to track AI citations?', pageUrl: '/features/ai-citation-tracker', competitor: null },
    { engine: 'perplexity', eventType: 'cited', delta: 5, prompt: 'AI visibility score explained', pageUrl: '/blog/ai-visibility-score', competitor: null },
    { engine: 'perplexity', eventType: 'rank_up', delta: 4, prompt: 'Competitor analysis for AI search', pageUrl: null, competitor: null },
    { engine: 'perplexity', eventType: 'competitor_overtake', delta: -3, prompt: 'Top SEO platforms', pageUrl: null, competitor: 'competitor-alpha.com' },

    // Copilot events
    { engine: 'copilot', eventType: 'cited', delta: 3, prompt: 'SEO tools for small business', pageUrl: '/pricing', competitor: null },
    { engine: 'copilot', eventType: 'rank_up', delta: 2, prompt: 'AI search optimization guide', pageUrl: null, competitor: null },
    { engine: 'copilot', eventType: 'rank_down', delta: -2, prompt: 'Best SEO software', pageUrl: null, competitor: 'sheetmagic.io' },
  ]

  for (let i = 0; i < citationEvents.length; i++) {
    const evt = citationEvents[i]
    await db.citationEvent.upsert({
      where: { id: `cite-${i}` },
      update: {},
      create: {
        id: `cite-${i}`,
        userId,
        domain,
        engine: evt.engine,
        eventType: evt.eventType,
        delta: evt.delta,
        prompt: evt.prompt,
        pageUrl: evt.pageUrl,
        competitor: evt.competitor,
        metadata: null,
        createdAt: new Date(now.getTime() - (i * 3 + 1) * oneHour),
      },
    })
  }

  // ─── Seed FeedItems ────────────────────────────────────────
  console.log('  Creating FeedItems...')

  const feedItems = [
    { itemType: 'citation_gained', title: 'ChatGPT cited your FAQ page', description: 'ChatGPT started citing your FAQ page for "best SEO tools" queries.', engine: 'chatgpt', delta: 6, severity: 'positive', iconEmoji: '📊' },
    { itemType: 'score_milestone', title: 'Score crossed 70!', description: 'Your AI Visibility Score reached 71, entering "Competitive" territory.', engine: null, delta: 3, severity: 'positive', iconEmoji: '🎯' },
    { itemType: 'citation_lost', title: 'Gemini dropped pricing citation', description: 'Your pricing page is no longer included in Gemini recommendations for "SEO vs AEO vs GEO".', engine: 'gemini', delta: -3, severity: 'warning', iconEmoji: '⚠️' },
    { itemType: 'competitor_alert', title: 'Competitor overtook you in Perplexity', description: 'competitor-alpha.com now ranks #2 in Perplexity results for "top SEO platforms".', engine: 'perplexity', delta: -3, severity: 'critical', iconEmoji: '⚔️' },
    { itemType: 'rank_change', title: 'Claude visibility +4% this week', description: 'Your overall Claude visibility increased by 4 percentage points.', engine: 'claude', delta: 4, severity: 'positive', iconEmoji: '📈' },
    { itemType: 'ai_discovery', title: 'Perplexity indexed your blog post', description: 'Perplexity now includes your recent blog post in its answer sources.', engine: 'perplexity', delta: 2, severity: 'info', iconEmoji: '🤖' },
    { itemType: 'new_entity', title: 'Brand entity recognized by Google', description: 'Google Knowledge Graph now recognizes your brand entity.', engine: null, delta: 5, severity: 'positive', iconEmoji: '🧠' },
    { itemType: 'citation_gained', title: 'Copilot cited your pricing page', description: 'Microsoft Copilot now mentions your pricing in SEO tool comparisons.', engine: 'copilot', delta: 3, severity: 'positive', iconEmoji: '📊' },
  ]

  for (let i = 0; i < feedItems.length; i++) {
    const item = feedItems[i]
    await db.feedItem.upsert({
      where: { id: `feed-${i}` },
      update: {},
      create: {
        id: `feed-${i}`,
        userId,
        domain,
        itemType: item.itemType,
        title: item.title,
        description: item.description,
        engine: item.engine,
        delta: item.delta,
        severity: item.severity,
        iconEmoji: item.iconEmoji,
        isRead: i > 2,
        metadata: null,
        createdAt: new Date(now.getTime() - (i * 2 + 1) * oneHour),
      },
    })
  }

  // ─── Seed Competitor Snapshots ─────────────────────────────
  console.log('  Creating competitor VisibilitySnapshots...')

  const competitors = [
    { domain: 'competitor-alpha.com', score: 78, trust: 70, freshness: 80, authority: 72, perEngine: { chatgpt: 80, claude: 68, gemini: 74, perplexity: 85, copilot: 60 } },
    { domain: 'sheetmagic.io', score: 65, trust: 58, freshness: 68, authority: 60, perEngine: { chatgpt: 66, claude: 52, gemini: 58, perplexity: 72, copilot: 50 } },
    { domain: 'competitor-beta.io', score: 58, trust: 52, freshness: 62, authority: 54, perEngine: { chatgpt: 60, claude: 48, gemini: 55, perplexity: 62, copilot: 42 } },
  ]

  for (const comp of competitors) {
    await db.visibilitySnapshot.upsert({
      where: { id: `snap-comp-${comp.domain.replace(/[^a-z]/g, '')}` },
      update: {},
      create: {
        id: `snap-comp-${comp.domain.replace(/[^a-z]/g, '')}`,
        userId: null,
        domain: comp.domain,
        overallScore: comp.score,
        trustScore: comp.trust,
        freshnessScore: comp.freshness,
        authorityScore: comp.authority,
        perEngine: JSON.stringify(comp.perEngine),
        dataSource: 'estimated',
        capturedAt: new Date(now.getTime() - 4 * oneHour),
      },
    })
  }

  // ─── Seed IndustryBenchmark ────────────────────────────────
  console.log('  Creating IndustryBenchmark...')

  await db.industryBenchmark.upsert({
    where: { industry: 'saas-seo' },
    update: {},
    create: {
      industry: 'saas-seo',
      industryLabel: 'SaaS / SEO Tools',
      avgAIVisibility: 55,
      avgTrust: 48,
      avgFreshness: 60,
      avgAuthority: 50,
      perEngine: JSON.stringify({ chatgpt: 58, claude: 45, gemini: 52, perplexity: 62, copilot: 38 }),
      sampleSize: 42,
    },
  })

  // ─── Seed ActionItems ─────────────────────────────────────
  console.log('  Creating ActionItems...')

  const actions = [
    { actionType: 'create_faq', title: 'Create FAQ page with schema markup', description: 'Add a comprehensive FAQ page with FAQPage structured data to improve AEO readiness.', priority: 'high', impact: 'high', estimatedScoreGain: 8, roiScore: 9.2, effortMinutes: 30, queuePosition: 1, relatedUrl: '/faq' },
    { actionType: 'add_author', title: 'Add author bios with E-E-A-T signals', description: 'Add author pages with credentials, links to published work, and schema markup.', priority: 'high', impact: 'high', estimatedScoreGain: 6, roiScore: 8.5, effortMinutes: 45, queuePosition: 2, relatedUrl: '/about' },
    { actionType: 'create_llms_txt', title: 'Create llms.txt file', description: 'Add a llms.txt file to your root directory to help AI crawlers understand your site.', priority: 'high', impact: 'medium', estimatedScoreGain: 5, roiScore: 8.0, effortMinutes: 10, queuePosition: 3, relatedUrl: '/llms.txt' },
    { actionType: 'fix_schema', title: 'Fix Organization schema errors', description: 'Resolve 3 validation errors in your Organization structured data markup.', priority: 'medium', impact: 'medium', estimatedScoreGain: 4, roiScore: 7.5, effortMinutes: 20, queuePosition: 4, relatedUrl: '/' },
    { actionType: 'content_update', title: 'Update blog with AI citation signals', description: 'Add direct answers, statistics, and expert quotes to your top 5 blog posts.', priority: 'medium', impact: 'medium', estimatedScoreGain: 3, roiScore: 6.8, effortMinutes: 60, queuePosition: 5, relatedUrl: '/blog' },
    { actionType: 'reddit_answer', title: 'Answer Reddit questions in your niche', description: 'Provide helpful answers on r/SEO and r/bigseo mentioning your brand naturally.', priority: 'low', impact: 'low', estimatedScoreGain: 2, roiScore: 5.5, effortMinutes: 90, queuePosition: 6, relatedUrl: null },
    { actionType: 'g2_review', title: 'Get G2 reviews for entity authority', description: 'Encourage customers to leave reviews on G2 to strengthen your entity signals.', priority: 'medium', impact: 'medium', estimatedScoreGain: 3, roiScore: 6.0, effortMinutes: 15, queuePosition: 7, relatedUrl: null },
  ]

  for (let i = 0; i < actions.length; i++) {
    const act = actions[i]
    await db.actionItem.upsert({
      where: { id: `action-${i}` },
      update: {},
      create: {
        id: `action-${i}`,
        userId,
        domain,
        actionType: act.actionType,
        title: act.title,
        description: act.description,
        priority: act.priority,
        impact: act.impact,
        estimatedScoreGain: act.estimatedScoreGain,
        roiScore: act.roiScore,
        effortMinutes: act.effortMinutes,
        queuePosition: act.queuePosition,
        status: i < 3 ? 'pending' : 'queued',
        relatedUrl: act.relatedUrl,
        metadata: null,
        autoExecuteEnabled: i < 2,
      },
    })
  }

  // ─── Seed VisibilityAlerts ─────────────────────────────────
  console.log('  Creating VisibilityAlerts...')

  const alerts = [
    { alertType: 'citation_drop', severity: 'warning', message: 'Gemini stopped citing your pricing page', data: JSON.stringify({ engine: 'gemini', page: '/pricing', previousCitations: 5 }) },
    { alertType: 'competitor_overtake', severity: 'critical', message: 'competitor-alpha.com overtook your position in Perplexity', data: JSON.stringify({ engine: 'perplexity', competitor: 'competitor-alpha.com' }) },
    { alertType: 'score_change', severity: 'info', message: 'AI Visibility Score increased from 68 to 71 (+3)', data: JSON.stringify({ before: 68, after: 71 }) },
  ]

  for (let i = 0; i < alerts.length; i++) {
    const alert = alerts[i]
    await db.visibilityAlert.upsert({
      where: { id: `alert-${i}` },
      update: {},
      create: {
        id: `alert-${i}`,
        userId,
        domain,
        alertType: alert.alertType,
        severity: alert.severity,
        message: alert.message,
        data: alert.data,
        isRead: i === 2,
      },
    })
  }

  // ─── Seed PromptTemplates ──────────────────────────────────
  console.log('  Creating PromptTemplates...')

  const templates = [
    { industry: 'saas-seo', category: 'brand', prompt: 'What is the best SEO tool for agencies?', language: 'en', isPopular: true },
    { industry: 'saas-seo', category: 'comparison', prompt: 'Compare SEO platforms for small business', language: 'en', isPopular: true },
    { industry: 'saas-seo', category: 'how-to', prompt: 'How to improve AI visibility for my website?', language: 'en', isPopular: true },
    { industry: 'saas-seo', category: 'definition', prompt: 'What is GEO optimization?', language: 'en', isPopular: false },
    { industry: 'saas-seo', category: 'brand', prompt: 'AI search optimization tools review', language: 'en', isPopular: true },
    { industry: 'saas-seo', category: 'how-to', prompt: 'How to get cited by ChatGPT?', language: 'en', isPopular: true },
    { industry: 'saas-seo', category: 'comparison', prompt: 'SEO vs AEO vs GEO differences', language: 'en', isPopular: true },
    { industry: 'saas-seo', category: 'definition', prompt: 'What is llms.txt?', language: 'en', isPopular: false },
  ]

  for (let i = 0; i < templates.length; i++) {
    const tpl = templates[i]
    await db.promptTemplate.upsert({
      where: { id: `tpl-${i}` },
      update: {},
      create: {
        id: `tpl-${i}`,
        industry: tpl.industry,
        category: tpl.category,
        prompt: tpl.prompt,
        language: tpl.language,
        isPopular: tpl.isPopular,
        usageCount: tpl.isPopular ? 50 + Math.floor(Math.random() * 200) : 10 + Math.floor(Math.random() * 30),
      },
    })
  }

  console.log('✅ P0 demo data seeded successfully!')
  console.log(`  - 4 VisibilitySnapshots (current, yesterday, 7d, 30d)`)
  console.log(`  - 21 CitationEvents (across 5 engines)`)
  console.log(`  - 8 FeedItems (citations, scores, alerts)`)
  console.log(`  - 3 Competitor snapshots`)
  console.log(`  - 1 IndustryBenchmark`)
  console.log(`  - 7 ActionItems`)
  console.log(`  - 3 VisibilityAlerts`)
  console.log(`  - 8 PromptTemplates`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
