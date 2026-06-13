'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { io, Socket } from 'socket.io-client'
import { useAppStore, SEOAnalysis } from '@/lib/store'
import { Globe, Loader2, AlertTriangle, ArrowLeft, MapPin, RefreshCw, Clock, Terminal } from 'lucide-react'

const phases = [
  { label: 'Scanning your website', icon: '🔍', phase: 'Phase 1' },
  { label: 'Master Director: Strategy assessment', icon: '🎯', phase: 'Batch 1' },
  { label: 'Keyword Researcher: Opportunity scoring', icon: '🔑', phase: 'Batch 1' },
  { label: 'Competitor Analyst: Reverse-engineering', icon: '🕵️', phase: 'Batch 1' },
  { label: 'Content Architect: Briefs & answer blocks', icon: '🏗️', phase: 'Batch 1' },
  { label: 'On-Page Auditor: Technical SEO fixes', icon: '🔍', phase: 'Batch 2' },
  { label: 'Link Strategist: Authority network', icon: '🔗', phase: 'Batch 2' },
  { label: 'Tech & Schema Auditor: E-E-A-T + GEO', icon: '⚙️', phase: 'Batch 2' },
  { label: 'Backlink Prospector: Outreach & KPIs', icon: '🤝', phase: 'Batch 2' },
  { label: 'Merging agent results', icon: '🔧', phase: '' },
  { label: 'Finalizing your strategy', icon: '✨', phase: '' },
]

const ANALYSIS_TIMEOUT = 240_000 // 4 minutes

// Simulated progress steps — used as visual fallback when SSE events lag
const SIMULATED_STEPS = [
  { progress: 5, step: 'Connecting to analysis engine...', delay: 0 },
  { progress: 8, step: 'Scanning your website...', delay: 500 },
  { progress: 15, step: 'Reading page content...', delay: 3000 },
  { progress: 20, step: 'Analyzing competitive landscape...', delay: 6000 },
  { progress: 28, step: 'Checking AI citation signals...', delay: 9000 },
  { progress: 35, step: 'Gathering local SEO data...', delay: 12000 },
  { progress: 38, step: 'Launching Agent Batch 1: Technical analysis...', delay: 15000 },
  { progress: 42, step: 'Running Master Director...', delay: 18000 },
  { progress: 47, step: 'Running Keyword Researcher...', delay: 22000 },
  { progress: 52, step: 'Running Competitor Analyst...', delay: 26000 },
  { progress: 57, step: 'Running Content Architect...', delay: 30000 },
  { progress: 60, step: 'Agent Batch 1 complete. Launching Batch 2...', delay: 34000 },
  { progress: 64, step: 'Running On-Page Auditor...', delay: 38000 },
  { progress: 69, step: 'Running Link Strategist...', delay: 42000 },
  { progress: 74, step: 'Running Tech & Schema Auditor...', delay: 46000 },
  { progress: 79, step: 'Running Backlink Prospector...', delay: 50000 },
  { progress: 82, step: 'Merging agent results...', delay: 54000 },
  { progress: 90, step: 'Compiling results...', delay: 58000 },
  { progress: 95, step: 'Finalizing your strategy...', delay: 62000 },
]

// ─────────────────────────────────────────────────────────────────────────────
// Agent Log Entry Types
// ─────────────────────────────────────────────────────────────────────────────

interface AgentLogEntry {
  id: string
  timestamp: number
  agentId: string
  agentName: string
  agentIcon: string
  action: string
  status: 'running' | 'complete' | 'error'
  duration?: number // seconds when complete
}

// Map agent IDs to their icons
const AGENT_ICON_MAP: Record<string, string> = {
  'master-director': '🎯',
  'keyword-researcher': '🔑',
  'competitor-analyst': '🕵️',
  'content-architect': '🏗️',
  'on-page-auditor': '🔍',
  'link-strategist': '🔗',
  'tech-schema-auditor': '⚙️',
  'backlink-prospector': '🤝',
}

// Map agent IDs to their colors
const AGENT_COLOR_MAP: Record<string, string> = {
  'master-director': 'text-emerald-400',
  'keyword-researcher': 'text-cyan-400',
  'competitor-analyst': 'text-amber-400',
  'content-architect': 'text-emerald-400',
  'on-page-auditor': 'text-cyan-400',
  'link-strategist': 'text-amber-400',
  'tech-schema-auditor': 'text-emerald-400',
  'backlink-prospector': 'text-cyan-400',
}

export default function AnalyzingView() {
  const {
    targetUrl,
    targetMarket,
    analysisProgress,
    analysisStep,
    analysisError,
    sessionId,
    mode,
    analysisEngine,
    jobId,
    jobStatus,
    setAnalysisProgress,
    setAnalysisStep,
    setAnalysis,
    setView,
    setAnalysisError,
    setSessionId,
    setJobId,
    setJobStatus,
    setCurrentAnalysisId,
  } = useAppStore()

  const analyzedUrlRef = useRef<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const simulationTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const sseProgressRef = useRef<number>(0) // Track latest SSE progress

  // Agent log state
  const [agentLogs, setAgentLogs] = useState<AgentLogEntry[]>([])
  const logContainerRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const agentStartTimesRef = useRef<Map<string, number>>(new Map())

  // Clear all simulation timers
  const clearSimulationTimers = useCallback(() => {
    simulationTimersRef.current.forEach((t) => clearTimeout(t))
    simulationTimersRef.current = []
  }, [])

  // Auto-scroll the log container
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [agentLogs])

  // ── WebSocket Connection ─────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return

    // Connect to the agent-stream WebSocket service
    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[AnalyzingView] WebSocket connected:', socket.id)
      // Join the session room
      socket.emit('join:session', sessionId)
    })

    socket.on('session:joined', (data: { sessionId: string; eventCount: number }) => {
      console.log('[AnalyzingView] Joined session:', data.sessionId, 'replay events:', data.eventCount)
    })

    socket.on('session:replay', (data: { sessionId: string; events: Array<{ event: string; data: Record<string, unknown>; timestamp: number }> }) => {
      // Replay stored events
      for (const evt of data.events) {
        handleSocketEvent(evt.event, evt.data, evt.timestamp)
      }
    })

    // ── Agent Events ──────────────────────────────────────────────
    socket.on('agent:start', (data: Record<string, unknown>) => {
      handleSocketEvent('agent:start', data, Date.now())
    })

    socket.on('agent:progress', (data: Record<string, unknown>) => {
      handleSocketEvent('agent:progress', data, Date.now())
    })

    socket.on('agent:complete', (data: Record<string, unknown>) => {
      handleSocketEvent('agent:complete', data, Date.now())
    })

    socket.on('agent:error', (data: Record<string, unknown>) => {
      handleSocketEvent('agent:error', data, Date.now())
    })

    socket.on('analysis:start', (data: Record<string, unknown>) => {
      handleSocketEvent('analysis:start', data, Date.now())
    })

    socket.on('analysis:complete', (data: Record<string, unknown>) => {
      console.log('[AnalyzingView] Analysis complete via WebSocket')
      // Transition to dashboard — fetch analysis from DB
      const analysisId = useAppStore.getState().currentAnalysisId
      if (analysisId) {
        fetch(`/api/analysis/${analysisId}`)
          .then(r => r.json())
          .then(dbData => {
            if (dbData.analysis) {
              clearSimulationTimers()
              sseProgressRef.current = 100
              setAnalysisProgress(100)
              setAnalysisStep('Analysis complete!')
              setAnalysis(dbData.analysis as SEOAnalysis)
              setTimeout(() => setView('dashboard'), 600)
            }
          })
          .catch(() => { /* ignore */ })
      }
    })

    socket.on('analysis:error', (data: Record<string, unknown>) => {
      console.error('[AnalyzingView] Analysis error via WebSocket:', data)
    })

    socket.on('disconnect', (reason) => {
      console.log('[AnalyzingView] WebSocket disconnected:', reason)
    })

    socket.on('connect_error', (err) => {
      console.warn('[AnalyzingView] WebSocket connect error:', err.message)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [sessionId])

  // Handle incoming socket events and update agent log state
  const handleSocketEvent = useCallback((event: string, data: Record<string, unknown>, timestamp: number) => {
    const agentId = (data.agentId as string) || ''
    const agentName = (data.agentName as string) || agentId

    if (event === 'agent:start') {
      const action = (data.action as string) || 'Starting...'
      agentStartTimesRef.current.set(agentId, timestamp)

      setAgentLogs((prev) => [
        ...prev,
        {
          id: `${agentId}-${timestamp}`,
          timestamp,
          agentId,
          agentName,
          agentIcon: AGENT_ICON_MAP[agentId] || '🤖',
          action,
          status: 'running',
        },
      ])
    } else if (event === 'agent:progress') {
      const message = (data.message as string) || 'Working...'
      // Update the last running entry for this agent, or add a progress line
      setAgentLogs((prev) => {
        const lastIdx = [...prev].reverse().findIndex((e) => e.agentId === agentId && e.status === 'running')
        if (lastIdx !== -1) {
          const actualIdx = prev.length - 1 - lastIdx
          const updated = [...prev]
          updated[actualIdx] = { ...updated[actualIdx], action: message }
          return updated
        }
        return [
          ...prev,
          {
            id: `${agentId}-progress-${timestamp}`,
            timestamp,
            agentId,
            agentName,
            agentIcon: AGENT_ICON_MAP[agentId] || '🤖',
            action: message,
            status: 'running',
          },
        ]
      })
    } else if (event === 'agent:complete') {
      const startTime = agentStartTimesRef.current.get(agentId) || timestamp
      const durationSec = ((timestamp - startTime) / 1000).toFixed(1)
      agentStartTimesRef.current.delete(agentId)

      setAgentLogs((prev) => {
        // Mark the last running entry for this agent as complete
        const lastIdx = [...prev].reverse().findIndex((e) => e.agentId === agentId && e.status === 'running')
        if (lastIdx !== -1) {
          const actualIdx = prev.length - 1 - lastIdx
          const updated = [...prev]
          updated[actualIdx] = {
            ...updated[actualIdx],
            status: 'complete',
            duration: parseFloat(durationSec),
            action: (data.result as string) || updated[actualIdx].action,
          }
          return updated
        }
        return [
          ...prev,
          {
            id: `${agentId}-complete-${timestamp}`,
            timestamp,
            agentId,
            agentName,
            agentIcon: AGENT_ICON_MAP[agentId] || '🤖',
            action: (data.result as string) || 'Complete',
            status: 'complete',
            duration: parseFloat(durationSec),
          },
        ]
      })
    } else if (event === 'agent:error') {
      const errorMsg = (data.error as string) || 'Failed'
      agentStartTimesRef.current.delete(agentId)

      setAgentLogs((prev) => {
        const lastIdx = [...prev].reverse().findIndex((e) => e.agentId === agentId && e.status === 'running')
        if (lastIdx !== -1) {
          const actualIdx = prev.length - 1 - lastIdx
          const updated = [...prev]
          updated[actualIdx] = {
            ...updated[actualIdx],
            status: 'error',
            action: errorMsg,
          }
          return updated
        }
        return [
          ...prev,
          {
            id: `${agentId}-error-${timestamp}`,
            timestamp,
            agentId,
            agentName,
            agentIcon: AGENT_ICON_MAP[agentId] || '🤖',
            action: errorMsg,
            status: 'error',
          },
        ]
      })
    } else if (event === 'analysis:start') {
      setAgentLogs((prev) => [
        ...prev,
        {
          id: `analysis-start-${timestamp}`,
          timestamp,
          agentId: 'system',
          agentName: 'Analysis Engine',
          agentIcon: '🚀',
          action: `Starting analysis for ${data.url || 'unknown URL'}`,
          status: 'complete',
          duration: 0,
        },
      ])
    }
  }, [])

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

  // Start simulated progress — this gives visual feedback even if SSE lags
  const startSimulatedProgress = useCallback(() => {
    clearSimulationTimers()
    SIMULATED_STEPS.forEach(({ progress, step, delay }) => {
      const timer = setTimeout(() => {
        // Only update if SSE hasn't already advanced past this point
        const currentSSE = sseProgressRef.current
        if (currentSSE < progress) {
          setAnalysisProgress(progress)
          setAnalysisStep(step)
        }
      }, delay)
      simulationTimersRef.current.push(timer)
    })
  }, [clearSimulationTimers, setAnalysisProgress, setAnalysisStep])

  useEffect(() => {
    if (analysisEngine === 'queue') return  // Queue mode uses its own effect below
    if (analyzedUrlRef.current === targetUrl || !targetUrl) return
    analyzedUrlRef.current = targetUrl
    sseProgressRef.current = 0

    const abortController = new AbortController()
    const { signal } = abortController

    // Client-side timeout
    const timeoutId = setTimeout(() => {
      abortController.abort()
      clearSimulationTimers()
      setAnalysisError('Analysis timed out. The server took too long to respond. Please try again.')
    }, ANALYSIS_TIMEOUT)

    // Start simulated progress immediately
    setAnalysisProgress(5)
    setAnalysisStep('Connecting to analysis engine...')
    startSimulatedProgress()

    const runAnalysis = async () => {
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl, market: targetMarket, mode }),
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
        let receivedSSE = false

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
                receivedSSE = true
                sseProgressRef.current = parsed.progress
                // SSE progress always overrides simulated progress
                setAnalysisProgress(parsed.progress)
                setAnalysisStep(parsed.step)

                // Set sessionId from the first SSE event if present
                if (parsed.sessionId && !sessionId) {
                  setSessionId(parsed.sessionId)
                }
              } else if (parsed.type === 'complete') {
                clearTimeout(timeoutId)
                clearSimulationTimers()
                sseProgressRef.current = 100
                setAnalysis(parsed.analysis as SEOAnalysis)
                setAnalysisProgress(100)
                setAnalysisStep('Analysis complete!')
                setTimeout(() => {
                  setView('dashboard')
                }, 600)
              } else if (parsed.type === 'error') {
                clearTimeout(timeoutId)
                clearSimulationTimers()
                setAnalysisError(parsed.message || 'Analysis failed. Please try again.')
              }
            } catch {
              // skip non-JSON lines
            }
          }
        }

        // If we received SSE events but no 'complete' event, that's a problem
        // But if we got some progress events, the analysis might still be running
        // The timeout will handle this case
        if (!receivedSSE && !signal.aborted) {
          // We got a 200 response but no SSE events at all — unusual
          console.warn('[AnalyzingView] No SSE events received from stream')
        }
      } catch (err) {
        if (signal.aborted) return
        clearTimeout(timeoutId)
        clearSimulationTimers()
        const message = err instanceof Error ? err.message : 'Analysis failed. Please try again.'
        setAnalysisError(message)
      }
    }

    runAnalysis()

    return () => {
      abortController.abort()
      clearTimeout(timeoutId)
      clearSimulationTimers()
      analyzedUrlRef.current = null
    }
  }, [targetUrl, targetMarket, setAnalysisProgress, setAnalysisStep, setAnalysis, setView, setAnalysisError, setSessionId, retryCount, startSimulatedProgress, clearSimulationTimers, sessionId])

  // ── Queue-based Analysis Flow (BullMQ) ─────────────────────────────
  // This runs when analysisEngine === 'queue'
  // 1. Call /api/audit/run → get jobId + sessionId (HTTP 202)
  // 2. Connect WebSocket for real-time agent events
  // 3. Poll /api/audit/[jobId] every 5s as fallback
  // 4. When completed → fetch full analysis from DB
  useEffect(() => {
    if (analysisEngine !== 'queue') return
    if (analyzedUrlRef.current === targetUrl || !targetUrl) return
    analyzedUrlRef.current = targetUrl
    sseProgressRef.current = 0

    let cancelled = false
    let pollInterval: ReturnType<typeof setInterval> | null = null
    let stuckCheckIntervalRef: ReturnType<typeof setInterval> | null = null

    const timeoutId = setTimeout(() => {
      cancelled = true
      clearSimulationTimers()
      setAnalysisError('Analysis timed out. The server took too long to respond. Please try again.')
    }, ANALYSIS_TIMEOUT)

    // Start simulated progress
    setAnalysisProgress(5)
    setAnalysisStep('Queuing analysis job...')
    startSimulatedProgress()

    const runQueueAnalysis = async () => {
      try {
        // Step 1: Enqueue the job
        const enqueueResponse = await fetch('/api/audit/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl, market: targetMarket, execution_mode: mode }),
        })

        if (!enqueueResponse.ok) {
          let errMsg = `Failed to queue analysis (HTTP ${enqueueResponse.status})`
          try {
            const errData = await enqueueResponse.json()
            errMsg = errData.error || errMsg
            // Special handling for rate limit errors
            if (errData.code === 'RATE_LIMIT_EXCEEDED') {
              errMsg = errData.error || 'Rate limit exceeded. Please upgrade your plan.'
            }
          } catch { /* ignore */ }
          throw new Error(errMsg)
        }

        const enqueueData = await enqueueResponse.json()

        if (cancelled) return

        const { jobId: newJobId, analysisId, sessionId: newSessionId } = enqueueData

        // Update store with job info
        setJobId(newJobId)
        setJobStatus('queued')
        setSessionId(newSessionId)
        setCurrentAnalysisId(analysisId)

        setAnalysisProgress(8)
        setAnalysisStep('Job queued. Waiting for 8 AI agents...')

        console.log(`[AnalyzingView] Job ${newJobId} queued (analysis: ${analysisId})`)

        // Step 2: Poll for job status every 5 seconds
        pollInterval = setInterval(async () => {
          if (cancelled) return

          try {
            const statusResponse = await fetch(`/api/audit/${newJobId}`)
            if (!statusResponse.ok) {
              // Job might have been evicted from in-memory queue
              // Try fetching analysis directly from DB
              return
            }

            const statusData = await statusResponse.json()

            if (cancelled) return

            setJobStatus(statusData.status as 'idle' | 'queued' | 'active' | 'completed' | 'failed' | 'unknown')

            if (statusData.status === 'active' && statusData.progress > 0) {
              // Worker is processing — update progress
              sseProgressRef.current = statusData.progress
              setAnalysisProgress(statusData.progress)
              setAnalysisStep('Agents are analyzing your site...')
            }

            if (statusData.status === 'completed') {
              // Job completed!
              clearTimeout(timeoutId)
              if (pollInterval) clearInterval(pollInterval)
              clearSimulationTimers()

              sseProgressRef.current = 100
              setAnalysisProgress(100)
              setAnalysisStep('Analysis complete!')
              setJobStatus('completed')

              // Fetch the full analysis from the status response or DB
              if (statusData.analysis) {
                setAnalysis(statusData.analysis as SEOAnalysis)
                setTimeout(() => setView('dashboard'), 600)
              } else if (statusData.data?.analysisId || statusData.analysisId) {
                // Fetch analysis from DB
                const fetchAnalysisId = statusData.analysisId || statusData.data?.analysisId
                try {
                  const dbResponse = await fetch(`/api/analysis/${fetchAnalysisId}`)
                  if (dbResponse.ok) {
                    const dbData = await dbResponse.json()
                    if (dbData.analysis) {
                      setAnalysis(dbData.analysis as SEOAnalysis)
                      setTimeout(() => setView('dashboard'), 600)
                    }
                  }
                } catch (dbErr) {
                  console.warn('[AnalyzingView] Failed to fetch analysis from DB:', dbErr)
                }
              }
            }

            if (statusData.status === 'failed') {
              clearTimeout(timeoutId)
              if (pollInterval) clearInterval(pollInterval)
              clearSimulationTimers()
              setJobStatus('failed')
              setAnalysisError(statusData.failedReason || 'Analysis failed. Please try again.')
            }
          } catch (pollErr) {
            // Polling error — don't break, just log
            console.warn('[AnalyzingView] Poll error:', pollErr instanceof Error ? pollErr.message : 'Unknown')
          }
        }, 5000)

        // Also trigger the first poll immediately after a short delay
        setTimeout(() => {
          if (!cancelled && pollInterval) {
            // Manually trigger first poll
            fetch(`/api/audit/${newJobId}`)
              .then(r => r.json())
              .then(data => {
                if (cancelled) return
                if (data.status === 'active') {
                  setJobStatus('active')
                  setAnalysisStep('8 AI agents are analyzing your site...')
                }
              })
              .catch(() => { /* ignore */ })
          }
        }, 2000)

        // ═══ FALLBACK: If stuck at high progress, try fetching analysis directly ═══
        // On Vercel, the worker function might be killed before the DB write completes,
        // leaving the analysis stuck at 'running' status. This fallback checks the DB
        // directly after a delay and transitions if the analysis data exists.
        let highProgressStartedAt: number | null = null
        const stuckCheckInterval = setInterval(async () => {
          if (cancelled) { clearInterval(stuckCheckInterval); return }

          const currentProgress = sseProgressRef.current
          if (currentProgress >= 90) {
            if (!highProgressStartedAt) highProgressStartedAt = Date.now()
            const stuckDuration = Date.now() - highProgressStartedAt

            // After 20 seconds stuck at 90%+, try fetching analysis directly
            if (stuckDuration > 20_000) {
              console.log('[AnalyzingView] Stuck at high progress, trying direct DB fetch...')
              try {
                const dbResponse = await fetch(`/api/analysis/${analysisId}`)
                if (dbResponse.ok) {
                  const dbData = await dbResponse.json()
                  if (dbData.analysis) {
                    // Analysis exists in DB — transition to dashboard
                    clearInterval(stuckCheckInterval)
                    clearTimeout(timeoutId)
                    if (pollInterval) clearInterval(pollInterval)
                    clearSimulationTimers()
                    sseProgressRef.current = 100
                    setAnalysisProgress(100)
                    setAnalysisStep('Analysis complete!')
                    setJobStatus('completed')
                    setAnalysis(dbData.analysis as SEOAnalysis)
                    setTimeout(() => setView('dashboard'), 600)
                  }
                }
              } catch {
                // DB fetch failed — keep waiting
              }
            }

            // After 60 seconds stuck, show timeout error
            if (stuckDuration > 60_000) {
              clearInterval(stuckCheckInterval)
              clearTimeout(timeoutId)
              if (pollInterval) clearInterval(pollInterval)
              clearSimulationTimers()
              setAnalysisError('Analysis appears stuck. The server may be under load. Please try again.')
            }
          } else {
            highProgressStartedAt = null
          }
        }, 10_000)
        stuckCheckIntervalRef = stuckCheckInterval

      } catch (err) {
        if (cancelled) return
        clearTimeout(timeoutId)
        if (pollInterval) clearInterval(pollInterval)
        clearSimulationTimers()
        const message = err instanceof Error ? err.message : 'Failed to queue analysis. Please try again.'
        setAnalysisError(message)
      }
    }

    runQueueAnalysis()

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      if (pollInterval) clearInterval(pollInterval)
      if (stuckCheckIntervalRef) clearInterval(stuckCheckIntervalRef)
      clearSimulationTimers()
      analyzedUrlRef.current = null
    }
  }, [targetUrl, targetMarket, analysisEngine, mode, setAnalysisProgress, setAnalysisStep, setAnalysis, setView, setAnalysisError, setSessionId, setJobId, setJobStatus, setCurrentAnalysisId, retryCount, startSimulatedProgress, clearSimulationTimers])

  const currentStepIndex = phases.findIndex((s) =>
    analysisStep.toLowerCase().includes(s.label.toLowerCase().split(' ')[0].toLowerCase())
  )

  const handleRetry = () => {
    const url = targetUrl
    const market = targetMarket
    analyzedUrlRef.current = null
    sseProgressRef.current = 0
    setAgentLogs([])
    agentStartTimesRef.current.clear()
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

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
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
          {analysisEngine === 'queue' && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                  jobStatus === 'queued' ? 'bg-amber-400 animate-pulse' :
                  jobStatus === 'active' ? 'bg-emerald-400 animate-pulse' :
                  'bg-muted-foreground/40'
                }`} />
                <span className="font-mono">
                  {jobStatus === 'queued' ? 'Queued' :
                   jobStatus === 'active' ? 'Processing' :
                   jobStatus === 'completed' ? 'Complete' :
                   jobStatus === 'failed' ? 'Failed' : 'Idle'}
                </span>
              </span>
            </>
          )}
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

        {/* ── Live Agent Log Panel ────────────────────────────────── */}
        <motion.div
          className="mt-6 rounded-xl border border-white/10 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-black/40 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Live Agent Stream</span>
              <span className="relative flex h-2.5 w-2.5 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground/50">
              {agentLogs.length} events
            </span>
          </div>

          {/* Log entries */}
          <div
            ref={logContainerRef}
            className="max-h-[300px] overflow-y-auto bg-black/60 font-mono text-xs"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.1) transparent',
            }}
          >
            {agentLogs.length === 0 ? (
              <div className="px-4 py-8 text-muted-foreground/40 text-center">
                Waiting for agent events...
              </div>
            ) : (
              <div className="p-2">
                <AnimatePresence initial={false}>
                  {agentLogs.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 transition-colors"
                    >
                      {/* Timestamp */}
                      <span className="text-muted-foreground/40 w-14 shrink-0 text-[10px]">
                        {formatTimestamp(entry.timestamp)}
                      </span>

                      {/* Agent icon */}
                      <span className="text-sm shrink-0">{entry.agentIcon}</span>

                      {/* Agent name */}
                      <span className={`shrink-0 font-semibold ${AGENT_COLOR_MAP[entry.agentId] || 'text-foreground'}`}>
                        {entry.agentName}
                      </span>

                      {/* Separator */}
                      <span className="text-muted-foreground/30 shrink-0">—</span>

                      {/* Action */}
                      <span className="text-muted-foreground truncate flex-1">
                        {entry.action}
                      </span>

                      {/* Status indicator */}
                      <span className="shrink-0 ml-auto">
                        {entry.status === 'running' && (
                          <span className="flex items-center gap-1">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-emerald-400 text-[10px]">Running</span>
                          </span>
                        )}
                        {entry.status === 'complete' && (
                          <span className="text-emerald-500 flex items-center gap-1">
                            <span>✓</span>
                            <span className="text-muted-foreground/60">{entry.duration?.toFixed(1)}s</span>
                          </span>
                        )}
                        {entry.status === 'error' && (
                          <span className="text-rose-400 text-[10px]">✗ error</span>
                        )}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
