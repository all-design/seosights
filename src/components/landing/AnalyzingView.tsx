'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAppStore, SEOAnalysis } from '@/lib/store'
import { Globe, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react'

const steps = [
  { label: 'Scanning your website', icon: '🔍' },
  { label: 'Analyzing content & structure', icon: '📄' },
  { label: 'Checking AI citation landscape', icon: '🤖' },
  { label: 'Running AI-powered SEO analysis', icon: '⚡' },
  { label: 'Parsing analysis results', icon: '📊' },
  { label: 'Finalizing your strategy', icon: '🎯' },
]

export default function AnalyzingView() {
  const {
    targetUrl,
    analysisProgress,
    analysisStep,
    analysisError,
    setAnalysisProgress,
    setAnalysisStep,
    setAnalysis,
    setView,
    setAnalysisError,
  } = useAppStore()

  // Use a ref to track the URL being analyzed, not a boolean flag
  // This way, when strict mode remounts, it can detect the URL is the same
  // and skip re-running the analysis
  const analyzedUrlRef = useRef<string | null>(null)

  useEffect(() => {
    // If we've already started analyzing this exact URL, don't restart
    if (analyzedUrlRef.current === targetUrl || !targetUrl) return
    analyzedUrlRef.current = targetUrl

    const abortController = new AbortController()
    const { signal } = abortController

    const runAnalysis = async () => {
      setAnalysisProgress(8)
      setAnalysisStep('Connecting to analysis engine...')

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl }),
          signal,
        })

        if (!response.ok) {
          let errMsg = 'Analysis failed'
          try {
            const errData = await response.json()
            errMsg = errData.error || errMsg
          } catch {
            // response might be streaming, just use generic message
          }
          throw new Error(errMsg)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response stream')

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          if (signal.aborted) break

          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'progress') {
                setAnalysisProgress(parsed.progress)
                setAnalysisStep(parsed.step)
              } else if (parsed.type === 'complete') {
                setAnalysis(parsed.analysis as SEOAnalysis)
                setAnalysisProgress(100)
                setAnalysisStep('Analysis complete!')
                // Small delay so user sees 100%
                setTimeout(() => {
                  setView('dashboard')
                }, 600)
              } else if (parsed.type === 'error') {
                setAnalysisError(parsed.message || 'Analysis failed')
              }
            } catch {
              // skip non-JSON lines
            }
          }
        }
      } catch (err) {
        if (signal.aborted) return // Ignore abort errors
        setAnalysisError(err instanceof Error ? err.message : 'Analysis failed. Please try again.')
      }
    }

    runAnalysis()

    return () => {
      abortController.abort()
      // Reset the ref so if the component remounts with the same URL,
      // it can restart (this handles strict mode properly)
      analyzedUrlRef.current = null
    }
  }, [targetUrl, setAnalysisProgress, setAnalysisStep, setAnalysis, setView, setAnalysisError])

  const currentStepIndex = steps.findIndex((s) =>
    analysisStep.toLowerCase().includes(s.label.toLowerCase().split(' ')[0].toLowerCase())
  )

  // Error state
  if (analysisError) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-rose-950/5 to-background" />
        <div className="relative z-10 max-w-md mx-auto px-4 text-center">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-rose-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Analysis Failed</h2>
          <p className="text-muted-foreground mb-6">{analysisError}</p>
          <button
            onClick={() => useAppStore.getState().reset()}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3 rounded-xl transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-emerald-950/10 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/8 rounded-full blur-[150px]" />

      <div className="relative z-10 max-w-xl mx-auto px-4 text-center">
        {/* Animated Globe */}
        <motion.div
          className="w-24 h-24 rounded-3xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-8"
          animate={{
            boxShadow: [
              '0 0 30px rgba(16,185,129,0.2)',
              '0 0 60px rgba(16,185,129,0.4)',
              '0 0 30px rgba(16,185,129,0.2)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Globe className="w-12 h-12 text-emerald-400" />
        </motion.div>

        {/* Title */}
        <motion.h2
          className="text-3xl font-bold mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Analyzing Your Site
        </motion.h2>

        {/* URL */}
        <motion.p
          className="text-emerald-400 font-mono text-sm mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {targetUrl}
        </motion.p>

        {/* Progress Bar */}
        <div className="w-full bg-white/5 rounded-full h-3 mb-4 overflow-hidden border border-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${Math.max(analysisProgress, 2)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Progress Percentage & Step */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-sm text-muted-foreground">{analysisStep}</span>
          <span className="text-sm font-mono text-emerald-400">{analysisProgress}%</span>
        </div>

        {/* Step Indicators */}
        <div className="space-y-3">
          {steps.map((step, i) => {
            const isActive = i === currentStepIndex
            const isDone =
              (i < currentStepIndex && currentStepIndex !== -1) ||
              analysisProgress >= (i + 1) * 17
            return (
              <motion.div
                key={step.label}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : isDone
                    ? 'bg-white/5 border border-white/5 opacity-60'
                    : 'bg-transparent border border-transparent opacity-30'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="text-lg">{step.icon}</span>
                <span
                  className={`text-sm ${
                    isActive ? 'text-emerald-400 font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
                {isActive && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin ml-auto" />}
                {isDone && !isActive && <span className="ml-auto text-emerald-500">✓</span>}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
