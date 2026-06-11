/**
 * 8-Agent SEO Analysis System
 * Each agent has a specialized role, system prompt, and user prompt template.
 * Agents produce focused JSON outputs that get merged into the final analysis.
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
// Agent 1: Crawler Agent — Technical SEO Audit
// ─────────────────────────────────────────────────────────────────────────────
const crawlerAgent: AgentDefinition = {
  id: 'crawler',
  name: 'Crawler Agent',
  role: 'Technical SEO audit: crawlability, indexation, page speed, robots.txt, sitemap',
  icon: '🔍',
  color: '#10b981',
  batch: 1,
  systemPrompt: `You are a Technical SEO Crawler Agent. You specialize in crawlability, indexation, page speed (Core Web Vitals), robots.txt, and sitemap analysis. Respond with ONLY valid JSON. No markdown. No code fences. Be concise — all string values under 15 words. This is critical to avoid truncation.`,
  buildUserPrompt: (ctx) => `Analyze ${ctx.url} for technical SEO. Title: ${ctx.siteName}. Content: ${ctx.siteContent.slice(0, 1200)}. HTML: ${ctx.htmlStructure.slice(0, 400)}. Market: ${ctx.targetMarket}.

Return JSON with this EXACT structure. All strings max 15 words:
{
  "siteName": "name",
  "market": "${ctx.targetMarket}",
  "overallScores": { "seo": 1-100, "aeo": 1-100, "geo": 1-100, "combined": 1-100 },
  "audit": {
    "technicalSEO": { "score": 1-100, "issues": [{ "issue": "short", "severity": "critical|warning|info", "fix": "short" }] },
    "crawlability": { "score": 1-100, "issues": [{ "issue": "short", "impact": "short" }] },
    "pageSpeed": { "score": 1-100, "coreVitals": [{ "metric": "LCP|INP|CLS", "value": "est", "status": "good|needs-improvement|poor" }] },
    "indexation": { "score": 1-100, "indexedPages": 0, "orphanPages": 0, "issues": ["short"] }
  }
}

QUANTITY: 3-4 technicalSEO issues, 2 crawlability, 3 coreVitals (always LCP, INP, CLS), 2 indexation issues.
SCORES: Realistic. Average site: 30-50. Combined = 40%SEO+30%AEO+30%GEO.
IMPORTANT: Return ONLY raw JSON. No code fences. No extra text.`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent 2: Schema Architect — Schema.org Markup Analysis
// ─────────────────────────────────────────────────────────────────────────────
const schemaArchitect: AgentDefinition = {
  id: 'schema',
  name: 'Schema Architect',
  role: 'Schema.org markup analysis: structured data detection, schema recommendations, JSON-LD generation',
  icon: '🏗️',
  color: '#8b5cf6',
  batch: 1,
  systemPrompt: `You are a Schema Architect Agent. You specialize in Schema.org markup, structured data detection, JSON-LD generation, and content architecture recommendations. Respond with ONLY valid JSON. No markdown. No code fences. Be concise — all string values under 15 words. This is critical to avoid truncation.`,
  buildUserPrompt: (ctx) => `Analyze ${ctx.url} for schema and structured data. Title: ${ctx.siteName}. Content: ${ctx.siteContent.slice(0, 1000)}. HTML: ${ctx.htmlStructure.slice(0, 400)}. Market: ${ctx.targetMarket}.

Return JSON with this EXACT structure. All strings max 15 words:
{
  "structure": {
    "schemaRecommendations": [{ "schemaType": "type", "purpose": "short", "pillar": "seo|aeo|geo", "implementation": "short", "status": "active|restricted|deprecated" }],
    "contentArchitecture": { "recommended": [{ "section": "name", "purpose": "short", "pillar": "seo|aeo|geo|all" }], "internalLinkMap": [{ "from": "page", "to": "page", "anchor": "text" }] }
  },
  "audit": {
    "aeoReadiness": { "score": 1-100, "hasFAQ": false, "hasSchema": false, "hasStructuredData": false, "answerFormatScore": 1-100, "issues": ["short"] }
  }
}

QUANTITY: 2-3 schemaRecommendations (FAQ, Organization, Article, BreadcrumbList), 3-4 contentArchitecture recommended, 2 internalLinks, 2 aeoReadiness issues.
IMPORTANT: Return ONLY raw JSON. No code fences. No extra text.`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent 3: Content Analyst — Content Quality & Humanization
// ─────────────────────────────────────────────────────────────────────────────
const contentAnalyst: AgentDefinition = {
  id: 'content',
  name: 'Content Analyst',
  role: 'Content quality: depth analysis, AI pattern detection, filler content, humanization tips, originality scoring',
  icon: '📝',
  color: '#f59e0b',
  batch: 1,
  systemPrompt: `You are a Content Analyst Agent. You specialize in content quality assessment, AI pattern detection, filler content identification, humanization tips, and originality scoring. Respond with ONLY valid JSON. No markdown. No code fences. Be concise — all string values under 15 words. This is critical to avoid truncation.`,
  buildUserPrompt: (ctx) => `Analyze content quality for ${ctx.url}. Title: ${ctx.siteName}. Content: ${ctx.siteContent.slice(0, 1500)}. Market: ${ctx.targetMarket}.

Return JSON with this EXACT structure. All strings max 15 words:
{
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
  }
}

QUANTITY: 2 humanizationTips, 2 fillerDetected, 2 originalityIndicators, 2 parasiteRisk findings+recs.
SCORES: Realistic. Average site content: 30-50.
IMPORTANT: Return ONLY raw JSON. No code fences. No extra text.`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent 4: E-E-A-T Auditor — Trust Signal Scoring
// ─────────────────────────────────────────────────────────────────────────────
const eeatAuditor: AgentDefinition = {
  id: 'eeat',
  name: 'E-E-A-T Auditor',
  role: 'Experience, Expertise, Authoritativeness, Trustworthiness scoring, Who/How/Why test, trust signals',
  icon: '🛡️',
  color: '#ef4444',
  batch: 1,
  systemPrompt: `You are an E-E-A-T Auditor Agent. You specialize in Experience, Expertise, Authoritativeness, and Trustworthiness scoring. You assess the Who/How/Why test, trust signals, author credibility, and brand authority. Respond with ONLY valid JSON. No markdown. No code fences. Be concise — all string values under 15 words. This is critical to avoid truncation.`,
  buildUserPrompt: (ctx) => `Evaluate E-E-A-T signals for ${ctx.url}. Title: ${ctx.siteName}. Content: ${ctx.siteContent.slice(0, 1200)}. Competitors: ${ctx.competitorInfo.slice(0, 200) || 'None'}. Market: ${ctx.targetMarket}.

Return JSON with this EXACT structure. All strings max 15 words:
{
  "eeat": {
    "overallScore": 1-100,
    "experience": { "score": 1-100, "findings": ["short"] },
    "expertise": { "score": 1-100, "findings": ["short"] },
    "authoritativeness": { "score": 1-100, "findings": ["short"] },
    "trustworthiness": { "score": 1-100, "findings": ["short"] },
    "whoHowWhyTest": { "who": "who", "how": "how", "why": "why" }
  }
}

QUANTITY: 2 findings per E-E-A-T dimension.
SCORES: Realistic. Average site: 20-40. Most sites lack strong E-E-A-T signals.
IMPORTANT: Return ONLY raw JSON. No code fences. No extra text.`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent 5: GEO Specialist — AI Search Optimization
// ─────────────────────────────────────────────────────────────────────────────
const geoSpecialist: AgentDefinition = {
  id: 'geo',
  name: 'GEO Specialist',
  role: 'AI search optimization: AI crawler access, llms.txt, citability scoring, brand mentions, entity recognition, knowledge graph',
  icon: '🤖',
  color: '#06b6d4',
  batch: 2,
  systemPrompt: `You are a GEO (Generative Engine Optimization) Specialist Agent. You specialize in AI crawler access analysis (GPTBot, ClaudeBot, PerplexityBot), llms.txt detection, citability scoring, brand mention signals, entity recognition, and knowledge graph presence. Respond with ONLY valid JSON. No markdown. No code fences. Be concise — all string values under 15 words. This is critical to avoid truncation.`,
  buildUserPrompt: (ctx) => `Analyze GEO/AI search optimization for ${ctx.url}. Title: ${ctx.siteName}. Content: ${ctx.siteContent.slice(0, 1000)}. AI Info: ${ctx.aiInfo.slice(0, 200) || 'None'}. Market: ${ctx.targetMarket}.

Return JSON with this EXACT structure. All strings max 15 words:
{
  "geoCitability": {
    "overallScore": 1-100,
    "citabilityScore": { "score": 1-100, "weight": 25, "findings": ["short"] },
    "structuralReadability": { "score": 1-100, "weight": 20, "findings": ["short"] },
    "multiModalContent": { "score": 1-100, "weight": 15, "findings": ["short"] },
    "authorityBrandSignals": { "score": 1-100, "weight": 20, "findings": ["short"] },
    "technicalAccessibility": { "score": 1-100, "weight": 20, "findings": ["short"] }
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
  "audit": {
    "geoVisibility": { "score": 1-100, "citedByAI": ["AI name"], "entityRecognition": 1-100, "knowledgeGraphPresence": false, "issues": ["short"] }
  }
}

QUANTITY: 1 finding per geoCitability dimension, 3-4 aiCrawlerAccess (GPTBot, ClaudeBot, PerplexityBot, Bytespider), 2 robotsTxtAnalysis, 3-4 platformPresence (Wikipedia, Reddit, YouTube, LinkedIn), 2 citationSources, 2 geoVisibility issues.
SCORES: Realistic. Average site: 15-35 for GEO metrics.
IMPORTANT: Return ONLY raw JSON. No code fences. No extra text.`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent 6: Link Architect — Backlink Strategy
// ─────────────────────────────────────────────────────────────────────────────
const linkArchitect: AgentDefinition = {
  id: 'link',
  name: 'Link Architect',
  role: 'Backlink strategy: backlink outreach targets, competitor gap analysis, link-building strategy, parasite SEO risk',
  icon: '🔗',
  color: '#ec4899',
  batch: 2,
  systemPrompt: `You are a Link Architect Agent. You specialize in backlink outreach, competitor gap analysis, link-building strategy, and parasite SEO risk assessment. Respond with ONLY valid JSON. No markdown. No code fences. Be concise — all string values under 15 words. This is critical to avoid truncation.`,
  buildUserPrompt: (ctx) => `Develop backlink strategy for ${ctx.url}. Title: ${ctx.siteName}. Competitors: ${ctx.competitorInfo.slice(0, 300) || 'None'}. Market: ${ctx.targetMarket}.

Return JSON with this EXACT structure. All strings max 15 words:
{
  "deepStrategy": {
    "backlinkOutreach": [{ "targetSite": "site name", "url": "approximate url", "strategy": "how to get link", "contentAngle": "pitch angle", "priority": "high|medium|low" }],
    "aiCitationStrategy": [{ "technique": "technique name", "implementation": "how to do it", "targetEngine": "ChatGPT|Perplexity|Google SGE|Claude", "expectedResult": "expected outcome" }]
  }
}

QUANTITY: 2-3 backlinkOutreach targets, 2-3 aiCitationStrategy techniques.
IMPORTANT: Return ONLY raw JSON. No code fences. No extra text.`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent 7: Local Scout — Local SEO Signals
// ─────────────────────────────────────────────────────────────────────────────
const localScout: AgentDefinition = {
  id: 'local',
  name: 'Local Scout',
  role: 'Local SEO: Google Business Profile, NAP consistency, review signals, market-specific optimization',
  icon: '📍',
  color: '#f97316',
  batch: 2,
  systemPrompt: `You are a Local Scout Agent. You specialize in Google Business Profile analysis, NAP (Name, Address, Phone) consistency, review signals, and market-specific local SEO optimization. Respond with ONLY valid JSON. No markdown. No code fences. Be concise — all string values under 15 words. This is critical to avoid truncation.`,
  buildUserPrompt: (ctx) => `Analyze local SEO signals for ${ctx.url}. Title: ${ctx.siteName}. Market: ${ctx.targetMarket}. Local Info: ${ctx.localInfo.slice(0, 200) || 'None'}. Content: ${ctx.siteContent.slice(0, 800)}.

Return JSON with this EXACT structure. All strings max 15 words:
{
  "localSEO": {
    "applicable": ${ctx.targetMarket !== 'Global'},
    "gbpSignals": { "score": 1-100, "findings": ["short"] },
    "napConsistency": { "score": 1-100, "findings": ["short"] },
    "reviewSignals": { "score": 1-100, "findings": ["short"] },
    "businessType": "type or N/A"
  }
}

QUANTITY: 1-2 findings per sub-score. applicable=true if local business or non-global market.
SCORES: Realistic. Average local business: 25-45.
IMPORTANT: Return ONLY raw JSON. No code fences. No extra text.`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent 8: SXO Strategist — Search Experience Optimization & Strategy Lead
// ─────────────────────────────────────────────────────────────────────────────
const sxoStrategist: AgentDefinition = {
  id: 'sxo',
  name: 'SXO Strategist',
  role: 'Search Experience Optimization: intent matching, page-type matching, persona scoring, SERP analysis, weekly action plans, roadmap, KPI tracking',
  icon: '🎯',
  color: '#6366f1',
  batch: 2,
  systemPrompt: `You are an SXO (Search Experience Optimization) Strategist Agent and strategy lead. You specialize in intent matching, page-type matching, persona scoring, SERP analysis, weekly action plans, roadmap, KPI tracking, content briefs, answer blocks, and technical implementations. You provide the overall summary and executive actions. Respond with ONLY valid JSON. No markdown. No code fences. Be concise — all string values under 15 words. This is critical to avoid truncation.`,
  buildUserPrompt: (ctx) => `Create comprehensive strategy for ${ctx.url} (${ctx.siteName}). Market: ${ctx.targetMarket}. Competitors: ${ctx.competitorInfo.slice(0, 200) || 'None'}. AI Info: ${ctx.aiInfo.slice(0, 150) || 'None'}.

Return JSON with this EXACT structure. All strings max 15 words:
{
  "sxo": {
    "pageTypeMatch": "short",
    "serpIntentMatch": "informational|transactional|navigational|mixed",
    "userPersonaScores": [{ "persona": "name", "score": 1-100 }],
    "recommendations": ["short"]
  },
  "structure": {
    "topicClusters": [{ "cluster": "name", "pillarKeyword": "kw", "supportingKeywords": ["kw1"], "seoOpportunity": "short", "aeoOpportunity": "short", "geoOpportunity": "short" }],
    "keywordGaps": [{ "keyword": "kw", "volume": "High|Med|Low", "difficulty": "Hard|Med|Easy", "type": "seo|aeo|geo", "opportunity": "short" }]
  },
  "creative": {
    "contentBriefs": [{ "title": "title", "type": "blog|guide|faq|tool|comparison", "targetKeyword": "kw", "pillar": "seo|aeo|geo|all", "brief": "short", "estimatedImpact": "short", "wordCount": "1000-2000", "structure": ["H2"] }],
    "onPageOptimizations": [{ "page": "url", "currentTitle": "old", "suggestedTitle": "new", "suggestedDescription": "desc", "aeoTweaks": ["tweak"], "geoTweaks": ["tweak"] }],
    "answerBlocks": [{ "question": "Q?", "suggestedAnswer": "40-60 word answer", "format": "faq|featured-snippet|people-also-ask|knowledge-panel", "targetEngine": "Google|ChatGPT|Perplexity" }]
  },
  "measure": {
    "kpiTracking": {
      "seo": [{ "metric": "name", "current": "val", "target": "val", "timeline": "3mo" }],
      "aeo": [{ "metric": "name", "current": "val", "target": "val", "timeline": "3mo" }],
      "geo": [{ "metric": "name", "current": "val", "target": "val", "timeline": "3mo" }]
    },
    "competitorBenchmarks": [{ "competitor": "name", "url": "url", "seoScore": 1-100, "aeoScore": 1-100, "geoScore": 1-100, "citedBy": ["AI"] }],
    "weeklyActions": [{ "week": "Week 1", "tasks": [{ "task": "short", "pillar": "seo|aeo|geo", "priority": "high|medium|low" }] }]
  },
  "algorithmUpdates": { "recentUpdates": [{ "name": "update name", "date": "2025-XX", "impact": "high|medium|low", "description": "short", "affectedPillar": "seo|aeo|geo|all" }] },
  "roadmap": { "quarters": [{ "label": "Q1: Foundation", "seoGoal": "short goal", "aeoGoal": "short goal", "geoGoal": "short goal", "targetScores": { "seo": 50, "aeo": 40, "geo": 35 } }] },
  "trafficInsights": { "winners": [{ "page": "page url", "change": "+X%", "pillar": "seo|aeo|geo" }], "losers": [{ "page": "page url", "change": "-X%", "pillar": "seo|aeo|geo" }] },
  "deepStrategy": {
    "technicalImplementations": [{ "type": "schema|robots|meta|headers", "description": "what to implement", "codeSnippet": "exact code", "priority": "critical|high|medium|low", "pillar": "seo|aeo|geo|all" }]
  },
  "summary": "2-3 sentence summary",
  "executiveActions": ["action1", "action2", "action3", "action4", "action5"]
}

QUANTITY: 3 topicClusters (1-2 supportingKeywords each), 4-5 keywordGaps, 3-4 contentBriefs (2 structure headings each), 2 onPageOptimizations (1-2 aeoTweaks + 1-2 geoTweaks each), 3-4 answerBlocks targeting different engines, 2 KPI per pillar, 2 competitorBenchmarks, 4 weeks of weeklyActions (2-3 tasks each), 5 executiveActions, 2-3 algorithmUpdates, 4 roadmap quarters, 2-3 trafficInsights winners, 2-3 losers, 3-4 technicalImplementations (with actual code snippets).
IMPORTANT: Return ONLY raw JSON. No code fences. No extra text. Code snippets must be valid and copy-paste ready.`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Export all agents in batch order
// ─────────────────────────────────────────────────────────────────────────────
export const agents: AgentDefinition[] = [
  crawlerAgent,
  schemaArchitect,
  contentAnalyst,
  eeatAuditor,
  geoSpecialist,
  linkArchitect,
  localScout,
  sxoStrategist,
]

export const batch1Agents = agents.filter((a) => a.batch === 1)
export const batch2Agents = agents.filter((a) => a.batch === 2)
