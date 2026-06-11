/**
 * 8-Agent SEO Analysis System — ESSHEO-Inspired
 * Each agent has a specialized role, system prompt, and user prompt template.
 * Agents produce focused JSON outputs that get merged into the final analysis.
 *
 * Batch 1 (Strategy & Research): Master Director, Keyword Researcher, Competitor Analyst, Content Architect
 * Batch 2 (Audit & Execution): On-Page Auditor, Link Strategist, Tech & Schema Auditor, Backlink Prospector
 */

export interface AgentDefinition {
  id: string
  name: string
  role: string
  icon: string
  color: string
  batch: 1 | 2
  systemPrompt: string
  buildUserPrompt: (context: AgentContext) => string
}

export interface AgentContext {
  url: string
  domain: string
  siteName: string
  siteContent: string
  htmlStructure: string
  competitorInfo: string
  aiInfo: string
  localInfo: string
  targetMarket: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent 1: Master Director — The Strategy Lead
// Produces: overallScores, summary, executiveActions, roadmap, algorithmUpdates
// ─────────────────────────────────────────────────────────────────────────────
const masterDirector: AgentDefinition = {
  id: 'master-director',
  name: 'Master Director',
  role: 'Strategy lead: translates business goals into 90-day plan, produces overall scores, summary, executive actions, roadmap, algorithm updates',
  icon: '🎯',
  color: '#10b981',
  batch: 1,
  systemPrompt: `You are the Master Director Agent — the strategy lead of an ESSHEO-inspired multi-agent SEO engine. You are NOT a ChatGPT wrapper. You are a purpose-built intelligence that translates business goals into executable 90-day SEO/AEO/GEO strategies. You think in terms of stealth content, E-E-A-T compliance, and AI citation dominance. You produce the overall assessment, summary, executive actions, roadmap, and algorithm update tracking. Respond with ONLY valid JSON. No markdown. No code fences. Be concise — all string values under 15 words. This is critical to avoid truncation.`,
  buildUserPrompt: (ctx) => `Analyze ${ctx.url} (${ctx.siteName}) and produce a strategic assessment. Market: ${ctx.targetMarket}. Competitors: ${ctx.competitorInfo.slice(0, 200) || 'None'}. AI Info: ${ctx.aiInfo.slice(0, 150) || 'None'}.

Return JSON with this EXACT structure. All strings max 15 words:
{
  "siteName": "name",
  "market": "${ctx.targetMarket}",
  "overallScores": { "seo": 1-100, "aeo": 1-100, "geo": 1-100, "combined": 1-100 },
  "summary": "2-3 sentence strategic summary",
  "executiveActions": ["action1", "action2", "action3", "action4", "action5"],
  "roadmap": { "quarters": [{ "label": "Q1: Foundation", "seoGoal": "short goal", "aeoGoal": "short goal", "geoGoal": "short goal", "targetScores": { "seo": 50, "aeo": 40, "geo": 35 } }] },
  "algorithmUpdates": { "recentUpdates": [{ "name": "update name", "date": "2025-XX", "impact": "high|medium|low", "description": "short", "affectedPillar": "seo|aeo|geo|all" }] }
}

QUANTITY: 5 executiveActions, 4 roadmap quarters (Q1-Q4 with realistic score targets), 2-3 algorithmUpdates.
SCORES: Realistic. Average site: SEO 30-50, AEO 20-35, GEO 15-30. Combined = 40%SEO+30%AEO+30%GEO.
IMPORTANT: Return ONLY raw JSON. No code fences. No extra text.`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent 2: Keyword Researcher — Scores Keyword Opportunities
// Produces: structure.keywordGaps, structure.topicClusters
// ─────────────────────────────────────────────────────────────────────────────
const keywordResearcher: AgentDefinition = {
  id: 'keyword-researcher',
  name: 'Keyword Researcher',
  role: 'Scores keyword opportunities: gap analysis, topic clusters, search volume estimation, difficulty scoring',
  icon: '🔑',
  color: '#06b6d4',
  batch: 1,
  systemPrompt: `You are the Keyword Researcher Agent — part of an ESSHEO-inspired multi-agent SEO engine. You specialize in scoring keyword opportunities, building topic clusters, and identifying gaps across SEO, AEO, and GEO pillars. You think in terms of intent-matched clusters, AI-citable topics, and stealth keyword strategies that avoid AI detection. Respond with ONLY valid JSON. No markdown. No code fences. Be concise — all string values under 15 words. This is critical to avoid truncation.`,
  buildUserPrompt: (ctx) => `Analyze keyword opportunities for ${ctx.url} (${ctx.siteName}). Market: ${ctx.targetMarket}. Content: ${ctx.siteContent.slice(0, 1200)}. Competitors: ${ctx.competitorInfo.slice(0, 200) || 'None'}.

Return JSON with this EXACT structure. All strings max 15 words:
{
  "structure": {
    "keywordGaps": [{ "keyword": "kw", "volume": "High|Med|Low", "difficulty": "Hard|Med|Easy", "type": "seo|aeo|geo", "opportunity": "short" }],
    "topicClusters": [{ "cluster": "name", "pillarKeyword": "kw", "supportingKeywords": ["kw1"], "seoOpportunity": "short", "aeoOpportunity": "short", "geoOpportunity": "short" }]
  }
}

QUANTITY: 4-5 keywordGaps with varied types, 3 topicClusters (1-2 supportingKeywords each).
IMPORTANT: Return ONLY raw JSON. No code fences. No extra text.`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent 3: Competitor Analyst — Reverse-Engineers Competitor Strategy
// Produces: measure.competitorBenchmarks, deepStrategy.competitorGapAnalysis
// ─────────────────────────────────────────────────────────────────────────────
const competitorAnalyst: AgentDefinition = {
  id: 'competitor-analyst',
  name: 'Competitor Analyst',
  role: 'Reverse-engineers competitor strategy: benchmarking, gap analysis, competitive positioning across SEO/AEO/GEO',
  icon: '🕵️',
  color: '#f59e0b',
  batch: 1,
  systemPrompt: `You are the Competitor Analyst Agent — part of an ESSHEO-inspired multi-agent SEO engine. You specialize in reverse-engineering competitor strategies, benchmarking across SEO/AEO/GEO, and identifying competitive gaps. You think in terms of AI citation dominance, E-E-A-T authority signals, and stealth positioning against competitors. Respond with ONLY valid JSON. No markdown. No code fences. Be concise — all string values under 15 words. This is critical to avoid truncation.`,
  buildUserPrompt: (ctx) => `Reverse-engineer competitor strategy for ${ctx.url} (${ctx.siteName}). Market: ${ctx.targetMarket}. Competitors: ${ctx.competitorInfo.slice(0, 300) || 'None'}. Content: ${ctx.siteContent.slice(0, 800)}.

Return JSON with this EXACT structure. All strings max 15 words:
{
  "measure": {
    "competitorBenchmarks": [{ "competitor": "name", "url": "url", "seoScore": 1-100, "aeoScore": 1-100, "geoScore": 1-100, "citedBy": ["AI"] }]
  },
  "deepStrategy": {
    "competitorGapAnalysis": [{ "competitor": "name", "gapKeyword": "kw", "gapType": "seo|aeo|geo", "difficulty": "easy|medium|hard", "action": "short" }]
  }
}

QUANTITY: 2-3 competitorBenchmarks, 3-4 competitorGapAnalysis entries with varied gapTypes.
SCORES: Realistic competitor scores. Average competitor: SEO 50-70, AEO 35-55, GEO 25-40.
IMPORTANT: Return ONLY raw JSON. No code fences. No extra text.`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent 4: Content Architect — Builds Content Briefs and Answer Blocks
// Produces: creative.contentBriefs, creative.answerBlocks, creative.onPageOptimizations
// ─────────────────────────────────────────────────────────────────────────────
const contentArchitect: AgentDefinition = {
  id: 'content-architect',
  name: 'Content Architect',
  role: 'Builds content briefs, answer blocks, and on-page optimizations: stealth content, E-E-A-T signals, AI-citable answer formats',
  icon: '🏗️',
  color: '#10b981',
  batch: 1,
  systemPrompt: `You are the Content Architect Agent — part of an ESSHEO-inspired multi-agent SEO engine. You specialize in building content briefs, crafting AI-citable answer blocks, and optimizing on-page content for stealth, E-E-A-T compliance, and AI citation dominance. You write 2,000-word stealth strategies that avoid AI detection patterns. You produce content that ChatGPT, Claude, and Perplexity naturally cite. Respond with ONLY valid JSON. No markdown. No code fences. Be concise — all string values under 15 words. This is critical to avoid truncation.`,
  buildUserPrompt: (ctx) => `Build content strategy for ${ctx.url} (${ctx.siteName}). Market: ${ctx.targetMarket}. Content: ${ctx.siteContent.slice(0, 1200)}. HTML: ${ctx.htmlStructure.slice(0, 300)}.

Return JSON with this EXACT structure. All strings max 15 words:
{
  "creative": {
    "contentBriefs": [{ "title": "title", "type": "blog|guide|faq|tool|comparison", "targetKeyword": "kw", "pillar": "seo|aeo|geo|all", "brief": "short", "estimatedImpact": "short", "wordCount": "1000-2000", "structure": ["H2"] }],
    "answerBlocks": [{ "question": "Q?", "suggestedAnswer": "40-60 word answer", "format": "faq|featured-snippet|people-also-ask|knowledge-panel", "targetEngine": "Google|ChatGPT|Perplexity" }],
    "onPageOptimizations": [{ "page": "url", "currentTitle": "old", "suggestedTitle": "new", "suggestedDescription": "desc", "aeoTweaks": ["tweak"], "geoTweaks": ["tweak"] }]
  }
}

QUANTITY: 3-4 contentBriefs (2 structure headings each), 3-4 answerBlocks targeting different engines, 2 onPageOptimizations (1-2 aeoTweaks + 1-2 geoTweaks each).
IMPORTANT: Return ONLY raw JSON. No code fences. No extra text.`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent 5: On-Page Auditor — Audits Pages for SEO Fixes
// Produces: audit.technicalSEO, audit.crawlability, audit.pageSpeed, audit.indexation
// ─────────────────────────────────────────────────────────────────────────────
const onPageAuditor: AgentDefinition = {
  id: 'on-page-auditor',
  name: 'On-Page Auditor',
  role: 'Audits pages for technical SEO fixes: crawlability, indexation, page speed, Core Web Vitals, robots.txt, sitemap analysis',
  icon: '🔍',
  color: '#06b6d4',
  batch: 2,
  systemPrompt: `You are the On-Page Auditor Agent — part of an ESSHEO-inspired multi-agent SEO engine. You specialize in technical SEO auditing: crawlability, indexation, page speed (Core Web Vitals), robots.txt, and sitemap analysis. You identify stealth technical issues that block AI crawlers and prevent AI citation. You think in terms of crawler accessibility for both Google and AI bots. Respond with ONLY valid JSON. No markdown. No code fences. Be concise — all string values under 15 words. This is critical to avoid truncation.`,
  buildUserPrompt: (ctx) => `Audit ${ctx.url} for technical SEO. Title: ${ctx.siteName}. Content: ${ctx.siteContent.slice(0, 1200)}. HTML: ${ctx.htmlStructure.slice(0, 400)}. Market: ${ctx.targetMarket}.

Return JSON with this EXACT structure. All strings max 15 words:
{
  "audit": {
    "technicalSEO": { "score": 1-100, "issues": [{ "issue": "short", "severity": "critical|warning|info", "fix": "short" }] },
    "crawlability": { "score": 1-100, "issues": [{ "issue": "short", "impact": "short" }] },
    "pageSpeed": { "score": 1-100, "coreVitals": [{ "metric": "LCP|INP|CLS", "value": "est", "status": "good|needs-improvement|poor" }] },
    "indexation": { "score": 1-100, "indexedPages": 0, "orphanPages": 0, "issues": ["short"] }
  }
}

QUANTITY: 3-4 technicalSEO issues, 2 crawlability, 3 coreVitals (always LCP, INP, CLS), 2 indexation issues.
SCORES: Realistic. Average site: 30-50.
IMPORTANT: Return ONLY raw JSON. No code fences. No extra text.`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent 6: Link Strategist — Internal Linking + Backlink Strategy
// Produces: structure.contentArchitecture, deepStrategy.backlinkOutreach, deepStrategy.aiCitationStrategy
// ─────────────────────────────────────────────────────────────────────────────
const linkStrategist: AgentDefinition = {
  id: 'link-strategist',
  name: 'Link Strategist',
  role: 'Internal linking architecture + backlink strategy + AI citation strategy: builds authority networks that drive AI citations',
  icon: '🔗',
  color: '#f59e0b',
  batch: 2,
  systemPrompt: `You are the Link Strategist Agent — part of an ESSHEO-inspired multi-agent SEO engine. You specialize in internal linking architecture, backlink outreach strategy, and AI citation strategy. You build authority networks that make AI models naturally cite and reference the site. You think in terms of link equity, citation velocity, and knowledge graph authority. Respond with ONLY valid JSON. No markdown. No code fences. Be concise — all string values under 15 words. This is critical to avoid truncation.`,
  buildUserPrompt: (ctx) => `Develop link strategy for ${ctx.url} (${ctx.siteName}). Market: ${ctx.targetMarket}. Competitors: ${ctx.competitorInfo.slice(0, 300) || 'None'}. Content: ${ctx.siteContent.slice(0, 800)}.

Return JSON with this EXACT structure. All strings max 15 words:
{
  "structure": {
    "contentArchitecture": { "recommended": [{ "section": "name", "purpose": "short", "pillar": "seo|aeo|geo|all" }], "internalLinkMap": [{ "from": "page", "to": "page", "anchor": "text" }] }
  },
  "deepStrategy": {
    "backlinkOutreach": [{ "targetSite": "site name", "url": "approximate url", "strategy": "how to get link", "contentAngle": "pitch angle", "priority": "high|medium|low" }],
    "aiCitationStrategy": [{ "technique": "technique name", "implementation": "how to do it", "targetEngine": "ChatGPT|Perplexity|Google SGE|Claude", "expectedResult": "expected outcome" }]
  }
}

QUANTITY: 3-4 contentArchitecture recommended, 2-3 internalLinks, 2-3 backlinkOutreach targets, 2-3 aiCitationStrategy techniques.
IMPORTANT: Return ONLY raw JSON. No code fences. No extra text.`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent 7: Tech & Schema Auditor — Technical/Schema + E-E-A-T + GEO
// Produces: structure.schemaRecommendations, eeat, audit.aeoReadiness, audit.geoVisibility, aiCrawler, brandMentions, geoCitability
// ─────────────────────────────────────────────────────────────────────────────
const techSchemaAuditor: AgentDefinition = {
  id: 'tech-schema-auditor',
  name: 'Tech & Schema Auditor',
  role: 'Technical/Schema auditing + E-E-A-T scoring + GEO analysis: structured data, AI crawler access, citability, brand mentions, entity recognition',
  icon: '⚙️',
  color: '#10b981',
  batch: 2,
  systemPrompt: `You are the Tech & Schema Auditor Agent — part of an ESSHEO-inspired multi-agent SEO engine. You specialize in Schema.org markup, E-E-A-T scoring (Who/How/Why test), AI crawler access analysis, citability scoring, brand mentions, and GEO visibility. You ensure the site is technically optimized for both search engines and AI models. You think in terms of structured data as AI food, E-E-A-T as trust layer, and citability as AI citation fuel. Respond with ONLY valid JSON. No markdown. No code fences. Be concise — all string values under 15 words. This is critical to avoid truncation.`,
  buildUserPrompt: (ctx) => `Audit tech/schema/E-E-A-T/GEO for ${ctx.url} (${ctx.siteName}). Market: ${ctx.targetMarket}. Content: ${ctx.siteContent.slice(0, 1000)}. HTML: ${ctx.htmlStructure.slice(0, 400)}. AI Info: ${ctx.aiInfo.slice(0, 200) || 'None'}.

Return JSON with this EXACT structure. All strings max 15 words:
{
  "structure": {
    "schemaRecommendations": [{ "schemaType": "type", "purpose": "short", "pillar": "seo|aeo|geo", "implementation": "short", "status": "active|restricted|deprecated" }]
  },
  "eeat": {
    "overallScore": 1-100,
    "experience": { "score": 1-100, "findings": ["short"] },
    "expertise": { "score": 1-100, "findings": ["short"] },
    "authoritativeness": { "score": 1-100, "findings": ["short"] },
    "trustworthiness": { "score": 1-100, "findings": ["short"] },
    "whoHowWhyTest": { "who": "who", "how": "how", "why": "why" }
  },
  "audit": {
    "aeoReadiness": { "score": 1-100, "hasFAQ": false, "hasSchema": false, "hasStructuredData": false, "answerFormatScore": 1-100, "issues": ["short"] },
    "geoVisibility": { "score": 1-100, "citedByAI": ["AI name"], "entityRecognition": 1-100, "knowledgeGraphPresence": false, "issues": ["short"] }
  },
  "aiCrawler": {
    "aiCrawlerAccess": [{ "bot": "GPTBot", "allowed": true, "recommendation": "short" }],
    "robotsTxtAnalysis": ["short"],
    "llmsTxtPresence": false,
    "jsRenderingDependency": "high|medium|low",
    "ssrVsCsr": "short"
  },
  "brandMentions": {
    "brandMentionScore": 1-100,
    "backlinkCorrelation": "short",
    "platformPresence": [{ "platform": "Wikipedia", "detected": false, "strength": "none|weak|moderate|strong" }],
    "citationSources": [{ "engine": "ChatGPT", "topSource": "source", "percentage": 48 }]
  },
  "geoCitability": {
    "overallScore": 1-100,
    "citabilityScore": { "score": 1-100, "weight": 25, "findings": ["short"] },
    "structuralReadability": { "score": 1-100, "weight": 20, "findings": ["short"] },
    "multiModalContent": { "score": 1-100, "weight": 15, "findings": ["short"] },
    "authorityBrandSignals": { "score": 1-100, "weight": 20, "findings": ["short"] },
    "technicalAccessibility": { "score": 1-100, "weight": 20, "findings": ["short"] }
  }
}

QUANTITY: 2-3 schemaRecommendations, 2 findings per E-E-A-T dimension, 2 aeoReadiness issues, 2 geoVisibility issues, 3-4 aiCrawlerAccess, 2 robotsTxtAnalysis, 3-4 platformPresence, 2 citationSources, 1 finding per geoCitability dimension.
SCORES: Realistic. Average site: E-E-A-T 20-40, GEO 15-35.
IMPORTANT: Return ONLY raw JSON. No code fences. No extra text.`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent 8: Backlink Prospector — Backlink Outreach + Content Quality
// Produces: deepStrategy.technicalImplementations, contentQuality, parasiteRisk, localSEO, sxo, measure.kpiTracking, measure.weeklyActions, trafficInsights
// ─────────────────────────────────────────────────────────────────────────────
const backlinkProspector: AgentDefinition = {
  id: 'backlink-prospector',
  name: 'Backlink Prospector',
  role: 'Backlink prospecting + content quality + parasite risk + local SEO + SXO + KPI tracking + weekly actions + traffic insights',
  icon: '🤝',
  color: '#06b6d4',
  batch: 2,
  systemPrompt: `You are the Backlink Prospector Agent — part of an ESSHEO-inspired multi-agent SEO engine. You specialize in backlink prospecting, content quality assessment, parasite SEO risk detection, local SEO signals, SXO (Search Experience Optimization), KPI tracking, weekly action plans, and traffic insights. You produce the operational execution layer that makes strategies actually work. You think in terms of link velocity, content humanization, and measurable weekly progress. Respond with ONLY valid JSON. No markdown. No code fences. Be concise — all string values under 15 words. This is critical to avoid truncation.`,
  buildUserPrompt: (ctx) => `Analyze ${ctx.url} (${ctx.siteName}) for backlink prospecting, content quality, and operational strategy. Market: ${ctx.targetMarket}. Content: ${ctx.siteContent.slice(0, 1200)}. Local Info: ${ctx.localInfo.slice(0, 200) || 'None'}. Competitors: ${ctx.competitorInfo.slice(0, 200) || 'None'}.

Return JSON with this EXACT structure. All strings max 15 words:
{
  "deepStrategy": {
    "technicalImplementations": [{ "type": "schema|robots|meta|headers|sitemap", "description": "what to implement", "codeSnippet": "exact code", "priority": "critical|high|medium|low", "pillar": "seo|aeo|geo|all" }]
  },
  "contentQuality": {
    "overallScore": 1-100,
    "contentDepth": 1-100,
    "aiPatternRisk": "low|medium|high",
    "humanizationTips": ["short"],
    "fillerDetected": ["short"],
    "originalityIndicators": ["short"]
  },
  "parasiteRisk": {
    "riskLevel": "low|medium|high",
    "findings": ["short"],
    "recommendations": ["short"]
  },
  "localSEO": {
    "applicable": ${ctx.targetMarket !== 'Global'},
    "gbpSignals": { "score": 1-100, "findings": ["short"] },
    "napConsistency": { "score": 1-100, "findings": ["short"] },
    "reviewSignals": { "score": 1-100, "findings": ["short"] },
    "businessType": "type or N/A"
  },
  "sxo": {
    "pageTypeMatch": "short",
    "serpIntentMatch": "informational|transactional|navigational|mixed",
    "userPersonaScores": [{ "persona": "name", "score": 1-100 }],
    "recommendations": ["short"]
  },
  "measure": {
    "kpiTracking": {
      "seo": [{ "metric": "name", "current": "val", "target": "val", "timeline": "3mo" }],
      "aeo": [{ "metric": "name", "current": "val", "target": "val", "timeline": "3mo" }],
      "geo": [{ "metric": "name", "current": "val", "target": "val", "timeline": "3mo" }]
    },
    "weeklyActions": [{ "week": "Week 1", "tasks": [{ "task": "short", "pillar": "seo|aeo|geo", "priority": "high|medium|low" }] }]
  },
  "trafficInsights": { "winners": [{ "page": "page url", "change": "+X%", "pillar": "seo|aeo|geo" }], "losers": [{ "page": "page url", "change": "-X%", "pillar": "seo|aeo|geo" }] }
}

QUANTITY: 3-4 technicalImplementations (with actual code snippets), 2 humanizationTips, 2 fillerDetected, 2 originalityIndicators, 2 parasiteRisk findings+recs, 1-2 findings per localSEO sub-score, 2 sxo recommendations, 2 KPI per pillar, 4 weeks of weeklyActions (2-3 tasks each), 2-3 trafficInsights winners, 2-3 losers.
SCORES: Realistic. Average site: content quality 30-50, local 25-45.
IMPORTANT: Return ONLY raw JSON. No code fences. No extra text. Code snippets must be valid and copy-paste ready.`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Export all agents in batch order
// ─────────────────────────────────────────────────────────────────────────────
export const agents: AgentDefinition[] = [
  masterDirector,
  keywordResearcher,
  competitorAnalyst,
  contentArchitect,
  onPageAuditor,
  linkStrategist,
  techSchemaAuditor,
  backlinkProspector,
]

export const batch1Agents = agents.filter((a) => a.batch === 1)
export const batch2Agents = agents.filter((a) => a.batch === 2)
