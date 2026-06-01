import { create } from 'zustand'

export type AppView = 'landing' | 'analyzing' | 'dashboard'

export interface SEOAnalysis {
  url: string
  siteName: string
  scores: {
    overall: number
    aiCitationReadiness: number
    contentQuality: number
    backlinkProfile: number
    technicalSEO: number
    keywordCoverage: number
  }
  citationGap: {
    competitors: { name: string; url: string; citedBy: string }[]
    gapSummary: string
    fixes: string[]
  }
  keywords: {
    primary: { keyword: string; volume: string; difficulty: string; opportunity: string }[]
    secondary: { keyword: string; volume: string; difficulty: string; opportunity: string }[]
  }
  backlinkStrategy: {
    currentProfile: string
    recommendedActions: { title: string; description: string; impact: 'high' | 'medium' | 'low' }[]
    linkableAssets: string[]
  }
  contentStrategy: {
    priority: { title: string; type: string; targetKeyword: string; estimatedImpact: string }[]
    contentGaps: string[]
  }
  roadmap: {
    phase: string
    timeframe: string
    tasks: string[]
  }[]
  summary: string
}

interface AppState {
  view: AppView
  targetUrl: string
  analysis: SEOAnalysis | null
  analysisProgress: number
  analysisStep: string
  setView: (view: AppView) => void
  setTargetUrl: (url: string) => void
  setAnalysis: (analysis: SEOAnalysis | null) => void
  setAnalysisProgress: (progress: number) => void
  setAnalysisStep: (step: string) => void
  reset: () => void
}

export const useAppStore = create<AppState>((set) => ({
  view: 'landing',
  targetUrl: '',
  analysis: null,
  analysisProgress: 0,
  analysisStep: '',
  setView: (view) => set({ view }),
  setTargetUrl: (url) => set({ targetUrl: url }),
  setAnalysis: (analysis) => set({ analysis }),
  setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
  setAnalysisStep: (step) => set({ analysisStep }),
  reset: () => set({ view: 'landing', targetUrl: '', analysis: null, analysisProgress: 0, analysisStep: '' }),
}))
