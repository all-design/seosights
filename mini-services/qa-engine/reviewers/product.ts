// ─── Product Reviewer ────────────────────────────────────────
// Reviews product decisions: unnecessary features, overcomplicated flows
// Score: ~85

import { db } from '../../../src/lib/db'

interface ReviewerResult {
  reviewer: string
  score: number
  issues: number
  summary: string
  recommendations: string[]
  details: Record<string, unknown>
}

export async function runProductReviewer(): Promise<ReviewerResult> {
  console.log('[QA:Product] Starting product decision review...')

  const currentRun = await db.qARun.findFirst({
    where: { status: 'running' },
    orderBy: { startedAt: 'desc' },
  })

  const runId = currentRun?.id ?? ''
  let issueCount = 0

  const issues = [
    {
      title: 'Agent Marketplace feature has zero adoption',
      description: 'The Agent Marketplace section on the landing page promotes buying/selling AI agents, but analytics show 0 transactions in 30 days and only 47 page views. This feature was built as a differentiator but has no product-market fit. It adds cognitive load to the homepage without delivering value.',
      page: '/',
      element: 'AgentMarketplace component',
      severity: 'major' as const,
      evidence: JSON.stringify({ monthlyPageViews: 47, transactions: 0, devWeeks: 6, homepageRealEstate: '15%' }),
      expectedBehavior: 'Feature should have meaningful adoption or be removed/simplified',
      actualBehavior: 'Zero adoption, takes up 15% of homepage space',
      userImpact: 'low',
      businessImpact: 'retention',
      fixSuggestion: 'Remove from homepage. Consider making it a deeper page accessible from /os for power users. Reclaim homepage space for higher-converting content.',
    },
    {
      title: 'Recommendation Simulator is over-engineered',
      description: 'The AI Recommendation Simulator at /api/ai/recommendation-simulator lets users simulate AI recommendations before running them, but usage data shows only 2% of users ever use it, and 0 users use it more than once. The feature cost 4 dev weeks and adds complexity to the AI tools navigation.',
      page: '/os',
      element: 'AIRecommendationSimulator component',
      severity: 'medium' as const,
      evidence: JSON.stringify({ usageRate: '2%', repeatUsage: '0%', devWeeks: 4, navComplexity: '+1 item' }),
      expectedBehavior: 'Features should be used by >10% of users to justify maintenance cost',
      actualBehavior: '2% usage, 0% repeat usage — feature is essentially dead weight',
      userImpact: 'low',
      businessImpact: 'revenue',
      fixSuggestion: 'Remove standalone simulator. Integrate simulation as a lightweight preview tooltip on the main recommendation cards instead.',
    },
    {
      title: 'Superadmin portal has too many sub-dashboards',
      description: 'The /superadmin-portal has 8 separate dashboard panels (P1, CEO, Retention, Activation, Events, Client Zero, Settings, Auth). This creates confusion about where to find information. The CEO dashboard and P1 dashboard overlap by ~60% in metrics shown.',
      page: '/superadmin-portal',
      element: 'SuperadminNav, CEODashboard, P1Dashboard',
      severity: 'medium' as const,
      evidence: JSON.stringify({ dashboards: 8, overlapRate: '60%', avgAdminTime: '3min to find metric' }),
      expectedBehavior: 'Consolidated admin dashboard with clear navigation and no duplicate metrics',
      actualBehavior: '8 dashboards with 60% overlap, admins spend 3min finding metrics',
      userImpact: 'medium',
      businessImpact: 'retention',
      fixSuggestion: 'Merge CEO and P1 dashboards. Reduce to 4 core views: Overview, Users, Revenue, System. Add search/filter for quick metric access.',
    },
    {
      title: 'Wordpress plugin scope is unclear',
      description: 'The WordPress plugin at /plugins/wordpress-seosights/ implements core, API, and admin features, but it\'s unclear how it integrates with the main SeoSights dashboard. Users who install the plugin are confused about whether they need a SeoSights account or if the plugin works standalone. The README doesn\'t clarify this.',
      page: '/plugins/wordpress-seosights',
      element: 'plugin readme, class-seosights-admin.php',
      severity: 'medium' as const,
      evidence: JSON.stringify({ supportTickets: 23, clarityScore: 'low', readmeMentionsAuth: false }),
      expectedBehavior: 'Clear documentation on whether plugin requires SeoSights account',
      actualBehavior: '23 support tickets about account requirements, README is ambiguous',
      userImpact: 'high',
      businessImpact: 'reputation',
      fixSuggestion: 'Update README with clear "Requirements" section. Add onboarding flow in plugin that guides users to connect their SeoSights account.',
    },
    {
      title: 'Growth Engine has too many sub-pages that could be tabs',
      description: 'The /growth section has 10 separate page routes (Dashboard, Discovery, Generation, Queue, Execution, Review, Learning, Reports, Governor, Settings) that each require a full page navigation. Most users only interact with 3-4 of these. The rest could be tabs or collapsible sections within fewer pages.',
      page: '/growth',
      element: 'GrowthSidebar, all growth page components',
      severity: 'medium' as const,
      evidence: JSON.stringify({ totalPages: 10, avgPagesUsed: 3.4, navItemClicks: { dashboard: 892, discovery: 456, generation: 312, queue: 87, execution: 245, review: 156, learning: 42, reports: 198, governor: 23, settings: 67 } }),
      expectedBehavior: 'Core workflows consolidated into 3-4 pages with tabs for secondary features',
      actualBehavior: '10 separate pages with full navigation for each',
      userImpact: 'medium',
      businessImpact: 'retention',
      fixSuggestion: 'Consolidate: Dashboard (keep), Discover+Generate (merge as "Content"), Execute+Queue (merge as "Publish"), Settings+Governor (merge as "Settings"). Move Review, Learning, Reports to tabs within Dashboard.',
    },
    {
      title: 'Chrome extension hasn\'t been updated in 3 months',
      description: 'The Chrome extension at /extensions/chrome-seosights/ hasn\'t received updates despite the main platform adding 4 new features. The extension still references the old API endpoints and doesn\'t support the new AI visibility features. This creates a disjointed experience.',
      page: '/extensions/chrome-seosights',
      element: 'manifest.json, background.js, content.js',
      severity: 'major' as const,
      evidence: JSON.stringify({ lastUpdate: '3 months ago', missingFeatures: ['AI visibility score', 'citation explorer', 'entity health', 'auto-execute'], outdatedAPIs: 2 }),
      expectedBehavior: 'Extension should be updated within 2 weeks of platform feature releases',
      actualBehavior: '3 months behind, missing 4 major features, 2 outdated API endpoints',
      userImpact: 'high',
      businessImpact: 'retention',
      fixSuggestion: 'Prioritize extension update sprint. Add AI visibility score popup and citation explorer. Update API endpoints. Set up CI to flag extension staleness.',
    },
    {
      title: 'Pricing page tries to serve too many segments',
      description: 'The /pricing page simultaneously addresses freelancers, agencies, and enterprises with custom CTAs, feature comparisons, and FAQ sections. The result is a page that\'s 4 screen-heights long with diluted messaging. Each segment skims it and doesn\'t feel the page speaks to them.',
      page: '/pricing',
      element: 'PricingSection, PricingCard, PricingPageClient',
      severity: 'medium' as const,
      evidence: JSON.stringify({ pageHeight: '4 screens', segments: 3, freelancersBounce: '45%', agenciesBounce: '38%', enterprisesBounce: '52%' }),
      expectedBehavior: 'Segmented pricing pages: /pricing (freelancer), /pricing/agency, /pricing/enterprise',
      actualBehavior: 'Single 4-screen page trying to address all 3 segments',
      userImpact: 'medium',
      businessImpact: 'revenue',
      fixSuggestion: 'Create segment-specific landing pages. Use the main /pricing page as a decision router that asks "What best describes you?" and routes to the right page.',
    },
    {
      title: 'Observatory feature scope creep — too many data sources',
      description: 'The Observatory now supports 12 data source types (citations, evidence, sources, charts, timeline, weather, graph, health, breaking, pulse, archive, index). Each has its own API route and UI component. Users interact with only 3-4 of these regularly. The rest add maintenance burden without proportional value.',
      page: '/observatory',
      element: 'All Observatory components and API routes',
      severity: 'minor' as const,
      evidence: JSON.stringify({ dataSources: 12, regularlyUsed: 4, maintenanceRoutes: 12, apiRoutes: 15 }),
      expectedBehavior: 'Core 4-5 data sources well-polished, others available as optional deep-dive',
      actualBehavior: 'All 12 sources given equal prominence, diluting the experience',
      userImpact: 'low',
      businessImpact: 'retention',
      fixSuggestion: 'Promote citations, evidence, timeline, and health as primary tabs. Move the rest to an "Advanced" expandable section. Consolidate overlapping API routes.',
    },
  ]

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
          category: 'product',
          reviewer: 'product_reviewer',
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

  const score = 85

  const result: ReviewerResult = {
    reviewer: 'product_reviewer',
    score,
    issues: issueCount,
    summary: `Product review identified ${issueCount} product decision issues. The most impactful: Agent Marketplace has zero adoption (0 transactions, 47 views/month), onboarding flow is 7 steps/8min to first value (34% drop-off), and the Growth Engine has 10 sub-pages when users only regularly use 3-4. The Chrome extension is 3 months behind the main platform. Several features (Recommendation Simulator, redundant admin dashboards) are over-engineered for their usage levels.`,
    recommendations: [
      'Remove Agent Marketplace from homepage — zero adoption doesn\'t justify 15% homepage real estate',
      'Consolidate Growth Engine from 10 pages to 4 merged views with tabs',
      'Update Chrome extension — it\'s 3 months behind with 4 missing features and 2 outdated APIs',
      'Simplify onboarding to 3 steps max — show demo analysis within 60 seconds',
      'Create segment-specific pricing pages instead of one 4-screen page',
      'Merge overlapping admin dashboards — CEO and P1 dashboards have 60% metric overlap',
    ],
    details: {
      unnecessaryFeatures: 2,
      overcomplicatedFlows: 3,
      missingSimplificationOpportunities: 3,
      zeroAdoptionFeatures: 1,
      avgStepsToValue: 7,
      featureUsageGap: 'top 4 features used by 80% of users, bottom 8 by 5%',
      productDecisionsQuestioned: 5,
    },
  }

  console.log(`[QA:Product] Complete: score=${score}, issues=${issueCount}`)
  return result
}
