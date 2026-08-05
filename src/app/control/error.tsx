'use client'

/**
 * Error Boundary for /control/* pages.
 *
 * Catches client-side exceptions during rendering, hydration, or in event handlers
 * and displays a user-friendly error UI instead of the generic Next.js error page.
 *
 * Next.js automatically passes `error` and `reset` props to error.tsx files.
 * `error`: the error that was thrown (has .digest for server errors, .message for client)
 * `reset`: function to retry rendering the route segment
 */

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

export default function ControlError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error for debugging
    console.error('[ControlErrorBoundary]', error)
  }, [error])

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">
            Something went wrong
          </h2>
          <p className="text-sm text-slate-400">
            An error occurred while loading this page. You can try again or go back to the overview.
          </p>
          {error.message && (
            <details className="mt-4 text-left">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
                Error details
              </summary>
              <pre className="mt-2 p-3 bg-slate-800 rounded-md text-xs text-slate-400 overflow-auto max-h-32">
                {error.message}
              </pre>
            </details>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
          <a
            href="/control"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-600 text-sm font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to Overview
          </a>
        </div>
      </div>
    </div>
  )
}
