'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore, SEOAnalysis } from '@/lib/store'
import { Globe, Loader2, AlertTriangle, ArrowLeft, MapPin, RefreshCw, Clock } from 'lucide-react'

const phases = [
  { label: 'Scanning your website', icon: '🔍', phase: 'Phase 1' },
  { label: 'Technical SEO & AEO readiness', icon: '⚙️', phase: 'Phase 1' },
  { label: 'GEO visibility & AI citation landscape', icon: '🤖', phase: 'Phase 1' },
  { label: 'E-E-A-T & content quality analysis', icon: '📋', phase: 'Phase 2' },
  { label: 'AI crawler & brand mention signals', icon: '🛡️', phase: 'Phase 2' },
  { label: 'Local SEO & SXO analysis', icon: '📍', phase: 'Phase 2' },
  { label: 'Structuring your strategy', icon: '📐', phase: 'Phase 3' },
  { label: 'Creating content briefs & answer blocks', icon: '✍️', phase: 'Phase 3' },
  { label: 'Building measurement framework', icon: '📊', phase: 'Phase 4' },
  { label: 'Parsing analysis results', icon: '🔧', phase: '' },
  { label: 'Finalizing your strategy', icon: '🎯', phase: '' },
]

const ANALYSIS_TIMEOUT = 180_000 // 3 minutes

export default function AnalyzingView() {
  const {
    targetUrl,
    targetMarket,
    analysisProgress,
    analysisStep,
    analysisError,
    setAnalysisProgress,
    setAnalysisStep,
    setAnalysis,
    setView,
    setAnalysisError,
  } = useAppStore()

  const analyzedUrlRef = useRef<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Elapsed time counter
  useEffect(() => {
    if (analysisError) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    setElapsed(0)
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [analysisError, retryCount])

  useEffect(() => {
    if (analyzedUrlRef.current === targetUrl || !targetUrl) return
    analyzedUrlRef.current = targetUrl

    const abortController = new AbortController()
    const { signal } = abortController

    // Client-side timeout
    const timeoutId = setTimeout(() => {
      abortController.abort()
      setAnalysisError('Analysis timed out. The server took too long to respond. Please try again.')
    }, ANALYSIS_TIMEOUT)

    const runAnalysis = async () => {
      setAnalysisProgress(5)
      setAnalysisStep('Connecting to analysis engine...')

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl, market: targetMarket }),
          signal,
        })

        if (!response.ok) {
          let errMsg = `Analysis failed (HTTP ${response.status})`
          try {
            const errData = await response.json()
            errMsg = errData.error || errMsg
          } catch {
            // response might be streaming
          }
          throw new Error(errMsg)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response stream received')

        const decoder = new TextDecoder()
        let buffer = ''
        let lastProgressTime = Date.now()

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
                lastProgressTime = Date.now()
                setAnalysisProgress(parsed.progress)
                setAnalysisStep(parsed.step)
              } else if (parsed.type === 'complete') {
                clearTimeout(timeoutId)
                setAnalysis(parsed.analysis as SEOAnalysis)
                setAnalysisProgress(100)
                setAnalysisStep('Analysis complete!')
                setTimeout(() => {
                  setView('dashboard')
                }, 600)
              } else if (parsed.type === 'error') {
                clearTimeout(timeoutId)
                setAnalysisError(parsed.message || 'Analysis failed. Please try again.')
              }
            } catch {
              // skip non-JSON lines
            }
          }
        }

        // If we reach here without completing, check if we got data
        // (stream ended without 'complete' event)
      } catch (err) {
        if (signal.aborted) return
        clearTimeout(timeoutId)
        const message = err instanceof Error ? err.message : 'Analysis failed. Please try again.'
        setAnalysisError(message)
      }
    }

    runAnalysis()

    return () => {
      abortController.abort()
      clearTimeout(timeoutId)
      analyzedUrlRef.current = null
    }
  }, [targetUrl, targetMarket, setAnalysisProgress, setAnalysisStep, setAnalysis, setView, setAnalysisError, retryCount])

  const currentStepIndex = phases.findIndex((s) =>
    analysisStep.toLowerCase().includes(s.label.toLowerCase().split(' ')[0].toLowerCase())
  )

  const handleRetry = () => {
    const url = targetUrl
    const market = targetMarket
    analyzedUrlRef.current = null
    useAppStore.getState().reset()
    setRetryCount((prev) => prev + 1)
    // Re-trigger analysis after a short delay
    setTimeout(() => {
      useAppStore.getState().startAnalysis(url, market)
    }, 100)
  }

  const handleGoBack = () => {
    useAppStore.getState().reset()
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (analysisError) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-rose-950/5 to-background" />
        <div className="relative z-10 max-w-md mx-auto px-4 text-center">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-rose-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Analysis Failed</h2>
          <p className="text-muted-foreground mb-2">{analysisError}</p>
          <p className="text-xs text-muted-foreground/50 mb-6">
            This can happen if the website is unreachable, blocks our crawler, or if the AI service is temporarily busy.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3 rounded-xl transition-all duration-300"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={handleGoBack}
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-foreground font-semibold px-6 py-3 rounded-xl transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
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

        <motion.h2
          className="text-3xl font-bold mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          SEO · AEO · GEO Analysis
        </motion.h2>

        <motion.p
          className="text-emerald-400 font-mono text-sm mb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {targetUrl}
        </motion.p>

        {targetMarket && targetMarket !== 'Global' && (
          <motion.p
            className="text-amber-400 font-mono text-sm mb-4 flex items-center justify-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <MapPin className="w-4 h-4" />
            Market: {targetMarket}
          </motion.p>
        )}

        {/* Elapsed Timer */}
        <motion.div
          className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Clock className="w-3 h-3" />
          <span>{formatTime(elapsed)}</span>
          <span>·</span>
          <span>Usually takes 30-90 seconds</span>
        </motion.div>

        {/* Progress Bar */}
        <div className="w-full bg-white/5 rounded-full h-3 mb-4 overflow-hidden border border-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${Math.max(analysisProgress, 2)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        <div className="flex items-center justify-between mb-8">
          <span className="text-sm text-muted-foreground">{analysisStep}</span>
          <span className="text-sm font-mono text-emerald-400">{analysisProgress}%</span>
        </div>

        {/* Phase Steps */}
        <div className="space-y-1.5 max-h-80 overflow-y-auto custom-scrollbar">
          {phases.map((step, i) => {
            const isActive = i === currentStepIndex
            const isDone = (i < currentStepIndex && currentStepIndex !== -1) || analysisProgress >= (i + 1) * 9
            return (
              <motion.div
                key={step.label}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : isDone
                    ? 'bg-white/5 border border-white/5 opacity-60'
                    : 'bg-transparent border border-transparent opacity-30'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <span className="text-lg">{step.icon}</span>
                <div className="flex-1 text-left">
                  <span className={`text-sm ${isActive ? 'text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </div>
                {step.phase && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-emerald-500/20 text-emerald-400' : isDone ? 'bg-white/5 text-muted-foreground' : 'bg-transparent text-muted-foreground/50'
                  }`}>
                    {step.phase}
                  </span>
                )}
                {isActive && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />}
                {isDone && !isActive && <span className="text-emerald-500">✓</span>}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
