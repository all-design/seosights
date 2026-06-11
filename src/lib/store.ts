import { create } from 'zustand'

export type AppView = 'landing' | 'analyzing' | 'dashboard'

// Three Pillar Scores
export interface PillarScores {
  seo: number    // 1-100 Traditional search engine optimization
  aeo: number    // 1-100 Answer Engine Optimization (featured snippets, voice, direct answers)
  geo: number    // 1-100 Generative Engine Optimization (ChatGPT, Claude, Perplexity, SGE)
}

// Audit Phase
export interface AuditData {
  technicalSEO: {
    score: number
    issues: { issue: string; severity: 'critical' | 'warning' | 'info'; fix: string }[]
  }
  crawlability: {
    score: number
    issues: { issue: string; impact: string }[]
  }
  pageSpeed: {
    score: number
    coreVitals: { metric: string; value: string; status: 'good' | 'needs-improvement' | 'poor' }[]
  }
  indexation: {
    score: number
    indexedPages: number
    orphanPages: number
    issues: string[]
  }
  aeoReadiness: {
    score: number
    hasFAQ: boolean
    hasSchema: boolean
    hasStructuredData: boolean
    answerFormatScore: number
    issues: string[]
  }
  geoVisibility: {
    score: number
    citedByAI: string[]
    entityRecognition: number
    knowledgeGraphPresence: boolean
    issues: string[]
  }
}

// Bonus: E-E-A-T Analysis (from claude-seo)
export interface EEATData {
  overallScore: number
  experience: { score: number; findings: string[] }
  expertise: { score: number; findings: string[] }
  authoritativeness: { score: number; findings: string[] }
  trustworthiness: { score: number; findings: string[] }
  whoHowWhyTest: { who: string; how: string; why: string }
}

// Bonus: GEO Citability Scoring (5 dimensions from claude-seo)
export interface GEOCitabilityData {
  overallScore: number
  citabilityScore: { score: number; weight: number; findings: string[] }
  structuralReadability: { score: number; weight: number; findings: string[] }
  multiModalContent: { score: number; weight: number; findings: string[] }
  authorityBrandSignals: { score: number; weight: number; findings: string[] }
  technicalAccessibility: { score: number; weight: number; findings: string[] }
}

// Bonus: AI Crawler & Bot Analysis (from claude-seo)
export interface AICrawlerData {
  aiCrawlerAccess: { bot: string; allowed: boolean; recommendation: string }[]
  robotsTxtAnalysis: string[]
  llmsTxtPresence: boolean
  jsRenderingDependency: 'high' | 'medium' | 'low'
  ssrVsCsr: string
}

// Bonus: Brand Mentions & AI Citation Signals (from claude-seo)
export interface BrandMentionsData {
  brandMentionScore: number
  backlinkCorrelation: string
  platformPresence: { platform: string; detected: boolean; strength: 'strong' | 'moderate' | 'weak' | 'none' }[]
  citationSources: { engine: string; topSource: string; percentage: number }[]
}

// Bonus: Content Quality & Humanization (from claude-seo)
export interface ContentQualityData {
  overallScore: number
  contentDepth: number
  aiPatternRisk: 'low' | 'medium' | 'high'
  humanizationTips: string[]
  fillerDetected: string[]
  originalityIndicators: string[]
}

// Bonus: Parasite SEO Risk (from claude-seo)
export interface ParasiteSEORisk {
  riskLevel: 'low' | 'medium' | 'high'
  findings: string[]
  recommendations: string[]
}

// Bonus: Local SEO Signals (from claude-seo)
export interface LocalSEOData {
  applicable: boolean
  gbpSignals: { score: number; findings: string[] }
  napConsistency: { score: number; findings: string[] }
  reviewSignals: { score: number; findings: string[] }
  businessType: string
}

// Bonus: SXO (Search Experience Optimization) (from claude-seo)
export interface SXOData {
  pageTypeMatch: string
  serpIntentMatch: 'informational' | 'transactional' | 'navigational' | 'mixed'
  userPersonaScores: { persona: string; score: number }[]
  recommendations: string[]
}

// Structure Phase
export interface StructureData {
  topicClusters: {
    cluster: string
    pillarKeyword: string
    supportingKeywords: string[]
    seoOpportunity: string
    aeoOpportunity: string
    geoOpportunity: string
  }[]
  keywordGaps: {
    keyword: string
    volume: string
    difficulty: string
    type: 'seo' | 'aeo' | 'geo'
    opportunity: string
  }[]
  contentArchitecture: {
    recommended: { section: string; purpose: string; pillar: 'seo' | 'aeo' | 'geo' | 'all' }[]
    internalLinkMap: { from: string; to: string; anchor: string }[]
  }
  schemaRecommendations: {
    schemaType: string
    purpose: string
    pillar: 'seo' | 'aeo' | 'geo'
    implementation: string
    status: 'active' | 'restricted' | 'deprecated'
  }[]
}

// Creative Phase
export interface CreativeData {
  contentBriefs: {
    title: string
    type: 'blog' | 'guide' | 'faq' | 'tool' | 'infographic' | 'case-study' | 'comparison' | 'definition'
    targetKeyword: string
    pillar: 'seo' | 'aeo' | 'geo' | 'all'
    brief: string
    estimatedImpact: string
    wordCount: string
    structure: string[]
  }[]
  onPageOptimizations: {
    page: string
    currentTitle: string
    suggestedTitle: string
    suggestedDescription: string
    aeoTweaks: string[]
    geoTweaks: string[]
  }[]
  answerBlocks: {
    question: string
    suggestedAnswer: string
    format: 'faq' | 'featured-snippet' | 'people-also-ask' | 'knowledge-panel'
    targetEngine: string
  }[]
}

// Measure Phase
export interface MeasureData {
  kpiTracking: {
    seo: { metric: string; current: string; target: string; timeline: string }[]
    aeo: { metric: string; current: string; target: string; timeline: string }[]
    geo: { metric: string; current: string; target: string; timeline: string }[]
  }
  competitorBenchmarks: {
    competitor: string
    url: string
    seoScore: number
    aeoScore: number
    geoScore: number
    citedBy: string[]
  }[]
  weeklyActions: {
    week: string
    tasks: { task: string; pillar: 'seo' | 'aeo' | 'geo'; priority: 'high' | 'medium' | 'low' }[]
  }[]
}

// Algorithm Updates Tracker
export interface AlgorithmUpdatesData {
  recentUpdates: { name: string; date: string; impact: 'high' | 'medium' | 'low'; description: string; affectedPillar: 'seo' | 'aeo' | 'geo' | 'all' }[]
}

// 12-Month Roadmap
export interface RoadmapData {
  quarters: { label: string; seoGoal: string; aeoGoal: string; geoGoal: string; targetScores: { seo: number; aeo: number; geo: number } }[]
}

// Traffic Insights (Winners/Losers)
export interface TrafficInsightsData {
  winners: { page: string; change: string; pillar: string }[]
  losers: { page: string; change: string; pillar: string }[]
}

// Deep Strategy (from third LLM call)
export interface DeepStrategyData {
  technicalImplementations: {
    type: 'schema' | 'robots' | 'meta' | 'headers' | 'sitemap'
    description: string
    codeSnippet: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    pillar: 'seo' | 'aeo' | 'geo' | 'all'
  }[]
  backlinkOutreach: {
    targetSite: string
    url: string
    strategy: string
    contentAngle: string
    priority: 'high' | 'medium' | 'low'
  }[]
  contentCalendar: {
    week: string
    title: string
    targetKeyword: string
    contentType: string
    pillar: 'seo' | 'aeo' | 'geo' | 'all'
    estimatedWords: number
    publishDate: string
  }[]
  competitorGapAnalysis: {
    competitor: string
    gapKeyword: string
    gapType: 'seo' | 'aeo' | 'geo'
    difficulty: 'easy' | 'medium' | 'hard'
    action: string
  }[]
  aiCitationStrategy: {
    technique: string
    implementation: string
    targetEngine: string
    expectedResult: string
  }[]
}

// Full Analysis Result
export interface SEOAnalysis {
  url: string
  siteName: string
  market: string
  overallScores: {
    seo: number
    aeo: number
    geo: number
    combined: number
  }
  audit: AuditData
  eeat: EEATData
  geoCitability: GEOCitabilityData
  aiCrawler: AICrawlerData
  brandMentions: BrandMentionsData
  contentQuality: ContentQualityData
  parasiteRisk: ParasiteSEORisk
  localSEO: LocalSEOData
  algorithmUpdates?: AlgorithmUpdatesData
  roadmap?: RoadmapData
  trafficInsights?: TrafficInsightsData
  deepStrategy?: DeepStrategyData
  sxo: SXOData
  structure: StructureData
  creative: CreativeData
  measure: MeasureData
  summary: string
  executiveActions: string[]
}

interface AppState {
  view: AppView
  targetUrl: string
  targetMarket: string
  analysis: SEOAnalysis | null
  analysisProgress: number
  analysisStep: string
  analysisError: string
  activeAgent: string | null
  setView: (view: AppView) => void
  setTargetUrl: (url: string) => void
  setTargetMarket: (market: string) => void
  setAnalysis: (analysis: SEOAnalysis | null) => void
  setAnalysisProgress: (progress: number) => void
  setAnalysisStep: (step: string) => void
  setAnalysisError: (error: string) => void
  setActiveAgent: (agent: string | null) => void
  reset: () => void
  startAnalysis: (url: string, market?: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  view: 'landing',
  targetUrl: '',
  targetMarket: 'Global',
  analysis: null,
  analysisProgress: 0,
  analysisStep: '',
  analysisError: '',
  activeAgent: null,
  setView: (view) => set({ view }),
  setTargetUrl: (url) => set({ targetUrl: url }),
  setTargetMarket: (market) => set({ targetMarket: market }),
  setAnalysis: (analysis) => set({ analysis }),
  setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
  setAnalysisStep: (step) => set({ analysisStep: step }),
  setAnalysisError: (error) => set({ analysisError: error }),
  setActiveAgent: (agent) => set({ activeAgent: agent }),
  reset: () => set({ view: 'landing', targetUrl: '', targetMarket: 'Global', analysis: null, analysisProgress: 0, analysisStep: '', analysisError: '', activeAgent: null }),
  startAnalysis: (url: string, market?: string) => {
    set({ targetUrl: url, targetMarket: market || 'Global', view: 'analyzing', analysisProgress: 5, analysisStep: 'Initializing analysis...', analysisError: '', analysis: null, activeAgent: null })
  },
}))
