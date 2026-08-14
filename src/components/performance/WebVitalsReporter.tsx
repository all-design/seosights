'use client'

// ─── Web Vitals RUM (Real User Monitoring) ──────────────────────
// Captures real Core Web Vitals from actual user sessions
// and reports them to the backend for aggregation.

import { useEffect, useRef } from 'react'

export function WebVitalsReporter() {
  const reported = useRef(false)

  useEffect(() => {
    if (reported.current) return
    reported.current = true

    async function reportVital(metric: { name: string; value: number; rating: string; delta: number; id: string }) {
      try {
        await fetch('/api/control/performance/vitals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: metric.name,
            value: metric.value,
            rating: metric.rating,
            delta: metric.delta,
            id: metric.id,
            url: window.location.href,
            path: window.location.pathname,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            connection: (navigator as any).connection
              ? {
                  effectiveType: (navigator as any).connection.effectiveType,
                  downlink: (navigator as any).connection.downlink,
                  rtt: (navigator as any).connection.rtt,
                }
              : null,
          }),
          keepalive: true,
        })
      } catch {
        // Silently fail — RUM should never break UX
      }
    }

    import('web-vitals').then(({ onLCP, onFID, onCLS, onTTFB, onINP, onFCP }) => {
      onLCP(reportVital)
      onFID(reportVital)
      onCLS(reportVital)
      onTTFB(reportVital)
      onINP(reportVital)
      onFCP(reportVital)
    }).catch(() => {
      // web-vitals not available — skip RUM
    })
  }, [])

  return null
}
