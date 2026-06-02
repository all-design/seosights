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
    citedByAI: string[]  // e.g. ['ChatGPT', 'Claude', 'Perplexity']
    entityRecognition: number  // 1-100
    knowledgeGraphPresence: boolean
    issues: string[]
  }
}

// Structure Phase
export interface StructureData {
  topicClusters: {
    cluster: string
    pillarKeyword: string
    supportingKeywords: string[]
    seoOpportunity: string
    aeoOpportunity: string  // How to structure for answer engines
    geoOpportunity: string  // How to get cited by AI
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
    structure: string[]  // H2/H3 outline
  }[]
  onPageOptimizations: {
    page: string
    currentTitle: string
    suggestedTitle: string
    suggestedDescription: string
    aeoTweaks: string[]  // Tweaks for answer engine optimization
    geoTweaks: string[]  // Tweaks for generative engine optimization
  }[]
  answerBlocks: {
    question: string
    suggestedAnswer: string
    format: 'faq' | 'featured-snippet' | 'people-also-ask' | 'knowledge-panel'
    targetEngine: string  // e.g. "Google", "ChatGPT", "Perplexity"
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

// Full Analysis Result
export interface SEOAnalysis {
  url: string
  siteName: string
  overallScores: {
    seo: number
    aeo: number
    geo: number
    combined: number
  }
  audit: AuditData
  structure: StructureData
  creative: CreativeData
  measure: MeasureData
  summary: string
  executiveActions: string[]  // Top 5 actions to take immediately
}

interface AppState {
  view: AppView
  targetUrl: string
  analysis: SEOAnalysis | null
  analysisProgress: number
  analysisStep: string
  analysisError: string
  setView: (view: AppView) => void
  setTargetUrl: (url: string) => void
  setAnalysis: (analysis: SEOAnalysis | null) => void
  setAnalysisProgress: (progress: number) => void
  setAnalysisStep: (step: string) => void
  setAnalysisError: (error: string) => void
  reset: () => void
  startAnalysis: (url: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  view: 'landing',
  targetUrl: '',
  analysis: null,
  analysisProgress: 0,
  analysisStep: '',
  analysisError: '',
  setView: (view) => set({ view }),
  setTargetUrl: (url) => set({ targetUrl: url }),
  setAnalysis: (analysis) => set({ analysis }),
  setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
  setAnalysisStep: (step) => set({ analysisStep: step }),
  setAnalysisError: (error) => set({ analysisError: error }),
  reset: () => set({ view: 'landing', targetUrl: '', analysis: null, analysisProgress: 0, analysisStep: '', analysisError: '' }),
  startAnalysis: (url: string) => {
    set({ targetUrl: url, view: 'analyzing', analysisProgress: 5, analysisStep: 'Initializing analysis...', analysisError: '', analysis: null })
  },
}))
