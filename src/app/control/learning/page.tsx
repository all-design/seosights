'use client'

import {
  GraduationCap,
  TrendingUp,
  ArrowRight,
  Brain,
  Sparkles,
  ThumbsDown,
  Lightbulb,
  Database,
  CheckCircle2,
  Link2,
  XCircle,
  Zap,
  BarChart3,
  BookOpen,
  Target,
} from 'lucide-react'

const confidenceData = [
  { month: 'Month 1', value: 52, label: '52%' },
  { month: 'Month 2', value: 61, label: '61%' },
  { month: 'Month 3', value: 68, label: '68%' },
  { month: 'Month 4', value: 74, label: '74%' },
  { month: 'Current', value: 81, label: '81%' },
]

const learnedPatterns = [
  {
    pattern: 'Adding FAQ schema → +15% AI citation rate',
    confidence: 94,
    dataPoints: 47,
    lastVerified: '2 days ago',
    category: 'SEO',
  },
  {
    pattern: 'Emerald CTA buttons → 23% more clicks than blue',
    confidence: 91,
    dataPoints: 31,
    lastVerified: '5 days ago',
    category: 'UX',
  },
  {
    pattern: 'Content >2000 words → 3x more AI references',
    confidence: 87,
    dataPoints: 62,
    lastVerified: '1 day ago',
    category: 'Content',
  },
  {
    pattern: 'Simpler copy → lower bounce rate',
    confidence: 85,
    dataPoints: 28,
    lastVerified: '3 days ago',
    category: 'Content',
  },
  {
    pattern: 'New components preferred over extending complex ones',
    confidence: 79,
    dataPoints: 19,
    lastVerified: '1 week ago',
    category: 'Engineering',
  },
  {
    pattern: 'Schema markup on landing pages → +18% CTR from AI',
    confidence: 82,
    dataPoints: 24,
    lastVerified: '4 days ago',
    category: 'SEO',
  },
  {
    pattern: 'Page load <2s → 40% lower bounce rate',
    confidence: 96,
    dataPoints: 89,
    lastVerified: '6 hours ago',
    category: 'Performance',
  },
  {
    pattern: 'Internal linking clusters → +22% time on site',
    confidence: 76,
    dataPoints: 15,
    lastVerified: '1 week ago',
    category: 'Content',
  },
]

const chains = [
  {
    suggestion: 'Add AI Advisor to hero',
    code: 'FloatingAdvisor.tsx',
    result: 'Conversion +2%',
    confidenceChange: '+4%',
    confidenceBefore: 71,
    confidenceAfter: 75,
  },
  {
    suggestion: 'Implement FAQ schema globally',
    code: 'FAQSchema.tsx + route.ts',
    result: 'AI citation rate +15%',
    confidenceChange: '+7%',
    confidenceBefore: 74,
    confidenceAfter: 81,
  },
  {
    suggestion: 'Simplify hero copy to <50 words',
    code: 'HeroSection.tsx refactor',
    result: 'Bounce rate -6%',
    confidenceChange: '+3%',
    confidenceBefore: 82,
    confidenceAfter: 85,
  },
  {
    suggestion: 'Add structured data to all pages',
    code: 'StructuredDataProvider.tsx',
    result: 'AI visibility +12 points',
    confidenceChange: '+5%',
    confidenceBefore: 79,
    confidenceAfter: 84,
  },
]

const failedHypotheses = [
  {
    hypothesis: 'Animated hero text increases engagement',
    result: 'Bounce rate increased by 3%',
    lesson: 'Keep it simple — animations distract from core message',
    dataPoints: 12,
  },
  {
    hypothesis: 'Pop-up CTA drives more conversions',
    result: 'Negative user feedback, -1.2% conversion',
    lesson: 'Use inline CTAs — users dislike interruption patterns',
    dataPoints: 8,
  },
  {
    hypothesis: 'Auto-playing video backgrounds increase dwell time',
    result: 'Page load +2.1s, 8% higher bounce rate',
    lesson: 'Performance impact always outweighs visual flair',
    dataPoints: 6,
  },
]

const footerStats = [
  { label: 'Patterns learned', value: '8', icon: Brain },
  { label: 'Avg confidence', value: '81%', icon: Target },
  { label: 'Data points', value: '315', icon: Database },
  { label: 'Improvement rate', value: '+29pp', icon: TrendingUp },
]

export default function LearningEnginePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Learning Engine™</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Suggestion → Code → Result → Confidence
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 self-start sm:self-auto">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">Learning</span>
        </div>
      </div>

      {/* Confidence Evolution */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Confidence Evolution</h2>
          <span className="ml-auto text-xs text-emerald-400 font-medium">+29pp over 4 months</span>
        </div>
        <div className="p-6">
          <div className="flex items-end gap-3 h-48">
            {confidenceData.map((d, i) => {
              const barHeight = (d.value / 100) * 160
              const isCurrent = i === confidenceData.length - 1
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                  <span
                    className={`text-xs font-bold ${
                      isCurrent ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {d.label}
                  </span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '160px' }}>
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        isCurrent
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                          : 'bg-gradient-to-t from-emerald-600/40 to-emerald-400/40'
                      }`}
                      style={{ height: `${barHeight}px` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">{d.month}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Confidence improving at ~7 percentage points per month
          </div>
        </div>
      </div>

      {/* Learned Patterns */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <Brain className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Learned Patterns</h2>
          <span className="ml-auto text-xs text-slate-500">{learnedPatterns.length} active patterns</span>
        </div>
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          <div className="divide-y divide-slate-800/50">
            {learnedPatterns.map((p, i) => (
              <div key={i} className="px-6 py-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium">{p.pattern}</div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        {p.dataPoints} data points
                      </span>
                      <span>Verified {p.lastVerified}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-medium">
                        {p.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${p.confidence}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-emerald-400 w-10 text-right">
                      {p.confidence}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Suggestion → Code → Result Chain */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <Link2 className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Suggestion → Code → Result Chain</h2>
        </div>
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          <div className="divide-y divide-slate-800/50">
            {chains.map((c, i) => (
              <div key={i} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  {/* Suggestion */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0" />
                      <span className="text-[10px] text-emerald-400/60 uppercase font-semibold tracking-wider">
                        Suggestion
                      </span>
                    </div>
                    <div className="text-sm text-white font-medium">{c.suggestion}</div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 hidden lg:block flex-shrink-0" />

                  {/* Code */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0" />
                      <span className="text-[10px] text-emerald-400/60 uppercase font-semibold tracking-wider">
                        Code
                      </span>
                    </div>
                    <div className="text-sm text-slate-300 font-mono">{c.code}</div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 hidden lg:block flex-shrink-0" />

                  {/* Result */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0" />
                      <span className="text-[10px] text-emerald-400/60 uppercase font-semibold tracking-wider">
                        Result
                      </span>
                    </div>
                    <div className="text-sm text-emerald-400 font-medium">{c.result}</div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 hidden lg:block flex-shrink-0" />

                  {/* Confidence Change */}
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400/60" />
                      <span className="text-[10px] text-emerald-400/60 uppercase font-semibold tracking-wider">
                        Confidence
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">{c.confidenceBefore}%</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="text-sm text-white font-semibold">{c.confidenceAfter}%</span>
                      <span className="text-xs font-bold text-emerald-400">({c.confidenceChange})</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Failed Hypotheses */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
          <ThumbsDown className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-semibold text-white">Failed Hypotheses</h2>
          <span className="ml-auto text-xs text-slate-500">Learning from what didn&apos;t work</span>
        </div>
        <div className="divide-y divide-slate-800/50">
          {failedHypotheses.map((f, i) => (
            <div key={i} className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <div className="text-[10px] text-red-400/60 uppercase font-semibold tracking-wider mb-0.5">
                      Hypothesis
                    </div>
                    <div className="text-sm text-white font-medium">{f.hypothesis}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mb-0.5">
                      Result
                    </div>
                    <div className="text-sm text-red-400">{f.result}</div>
                  </div>
                  <div className="flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3">
                    <BookOpen className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] text-emerald-400/60 uppercase font-semibold tracking-wider mb-0.5">
                        Lesson Learned
                      </div>
                      <div className="text-sm text-slate-300">{f.lesson}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    <Database className="w-3 h-3 inline mr-1" />
                    {f.dataPoints} data points collected before concluding
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {footerStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-slate-900 rounded-xl border border-slate-800 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-emerald-400/60" />
                <span className="text-xs text-slate-500">{stat.label}</span>
              </div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
